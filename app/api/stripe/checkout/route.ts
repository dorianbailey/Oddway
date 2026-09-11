import { NextResponse } from "next/server";
import { PLANS, getStripe, priceIdFor, siteUrl, type PlanId } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Start a subscription.
 *
 * The browser sends a plan name and nothing else. It does not send a price, an
 * amount, or a Stripe id — if it did, the price would be whatever the browser
 * said it was, and somebody would eventually notice. The mapping from plan to
 * price happens here, against environment variables, on the server.
 */
export async function POST(request: Request) {
  let plan: PlanId;

  try {
    const body = await request.json();
    const asked = String(body?.plan ?? "");
    if (asked !== "banner" && asked !== "map") {
      return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
    }
    plan = asked;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const price = priceIdFor(plan);
  if (!price) {
    /*
      A missing price id is a deployment problem, not the visitor's. Say so
      plainly rather than sending them to a Stripe page that will fail.
    */
    console.error(`No Stripe price configured for plan "${plan}".`);
    return NextResponse.json(
      { error: "Advertising checkout is not available right now." },
      { status: 503 },
    );
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],

      /*
        No customer_creation here. Stripe rejects it outside one-off payment
        mode, and a subscription has to have a customer to bill, so it always
        makes one regardless — the flag was both invalid and pointless.

        The email comes back on the session either way, which is what the
        webhook needs: it is the address the setup link goes to, and it is the
        one on the card rather than one typed into a form beforehand.
      */
      success_url: `${siteUrl()}/advertise/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/advertise`,

      // Read back in the webhook, so the row knows what was bought.
      metadata: { plan },
      subscription_data: { metadata: { plan } },

      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe returned a session with no URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (caught) {
    console.error("Stripe checkout failed:", caught);
    return NextResponse.json(
      { error: `Could not start checkout for ${PLANS[plan].name}.` },
      { status: 502 },
    );
  }
}
