import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { getStripe, planForPrice } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { notifyAdvertiser, notifyUsOfSale } from "@/lib/notify-advertiser";

export const runtime = "nodejs";

/*
  The raw body is required.

  Stripe signs the exact bytes it sent. Parsing to JSON and re-serialising
  changes them — key order, whitespace, number formatting — and the signature
  no longer matches. So: request.text(), and nothing touches it first.
*/

/**
 * Stripe tells us what happened.
 *
 * Three events matter:
 *
 *   checkout.session.completed     somebody paid; make a pending row
 *   customer.subscription.updated  the status or the paid-through date moved
 *   customer.subscription.deleted  it ended
 *
 * Nothing here ever sets an advertiser to active. Paying buys a slot, not
 * publication: the banner is a stranger's image on our pages and a person
 * looks at it first. A webhook that could publish would be a webhook that
 * could be tricked into publishing.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secret || !signature) {
    return NextResponse.json({ error: "Not configured." }, { status: 400 });
  }

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch (caught) {
    /*
      An unverified body is an anonymous stranger claiming a payment happened.
      Refuse it and say nothing useful about why.
    */
    console.error("Stripe signature verification failed:", caught);
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await onSubscriptionChanged(event.data.object);
        break;
      default:
        // Subscribed to more than we handle is fine; handling less is not.
        break;
    }
  } catch (caught) {
    /*
      A 500 makes Stripe retry, which is what we want for a transient database
      failure — the alternative is a paid subscription with no row anywhere.
      Retries are why every write below is idempotent.
    */
    console.error(`Handling ${event.type} failed:`, caught);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) return;

  const email =
    session.customer_details?.email ?? session.customer_email ?? null;
  if (!email) {
    console.error(`Checkout ${session.id} completed with no email address.`);
    return;
  }

  const plan =
    (session.metadata?.plan as "banner" | "map" | undefined) ?? "banner";

  /*
    A token with 256 bits behind it, url-safe.

    This is the only thing protecting the advertiser's banner and destination
    URL from anybody who guesses it, so it is not a timestamp, a counter, or an
    id with a hyphen in it.
  */
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 7 * 86_400_000).toISOString();

  const supabase = getAdminSupabase();

  /*
    Keyed on the subscription id, which is unique.

    Stripe delivers at least once, not exactly once, so this handler will
    sometimes run twice for one payment. Upserting means the second run finds
    the first one's row instead of creating a duplicate — and ignoreDuplicates
    keeps it from minting a second token and emailing the advertiser again.
  */
  const { error } = await supabase
    .from("advertisers")
    .upsert(
      {
        business_name: session.customer_details?.name ?? "New advertiser",
        contact_name: session.customer_details?.name ?? null,
        contact_email: email,
        destination_url: "",
        plan,
        status: "pending",
        stripe_customer_id:
          typeof session.customer === "string"
            ? session.customer
            : (session.customer?.id ?? null),
        stripe_subscription_id: subscriptionId,
        submit_token: token,
        submit_token_expires_at: expires,
        starts_at: new Date().toISOString().slice(0, 10),
      },
      { onConflict: "stripe_subscription_id", ignoreDuplicates: true },
    );

  if (error) throw new Error(error.message);

  /*
    Read back rather than trusting the write.

    If this was a retry, ignoreDuplicates means nothing was written and the
    token above is not the one in the row — emailing it would send a link that
    does not work. The row is the truth; the variable is a hope.
  */
  const { data: row } = await supabase
    .from("advertisers")
    .select("submit_token, contact_email, plan, submitted_at")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!row?.submit_token || row.submitted_at) return;

  await notifyAdvertiser({
    email: row.contact_email as string,
    token: row.submit_token as string,
    plan: row.plan as "banner" | "map",
  });
  await notifyUsOfSale({
    email: row.contact_email as string,
    plan: row.plan as "banner" | "map",
  });
}

async function onSubscriptionChanged(subscription: Stripe.Subscription) {
  const supabase = getAdminSupabase();

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = planForPrice(priceId);

  /*
    Stripe's status vocabulary is larger than ours, so it is mapped rather than
    stored raw. Note what is deliberately absent: nothing here sets "active".
    A lapsed advertiser who pays again returns to paused, and a person decides
    whether the banner goes back up.
  */
  const patch: Record<string, unknown> = {
    current_period_end: periodEnd(subscription),
    updated_at: new Date().toISOString(),
    ...(plan ? { plan } : {}),
  };

  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired"
  ) {
    patch.status = "cancelled";
  } else if (
    subscription.status === "past_due" ||
    subscription.status === "unpaid" ||
    subscription.status === "paused"
  ) {
    patch.status = "paused";
  }

  const { error } = await supabase
    .from("advertisers")
    .update(patch)
    .eq("stripe_subscription_id", subscription.id);

  if (error) throw new Error(error.message);
}

/**
 * Paid through.
 *
 * Somebody who cancels on the third has paid for the month, and the view that
 * decides what renders compares against this rather than against the status —
 * so a cancellation takes the banner down when the month runs out, not that
 * afternoon.
 *
 * The field moved from the subscription to its items in a recent API version,
 * so both are read.
 */
function periodEnd(subscription: Stripe.Subscription): string | null {
  const candidate =
    (subscription as unknown as { current_period_end?: number })
      .current_period_end ?? subscription.items?.data?.[0]?.current_period_end;

  return typeof candidate === "number"
    ? new Date(candidate * 1000).toISOString()
    : null;
}
