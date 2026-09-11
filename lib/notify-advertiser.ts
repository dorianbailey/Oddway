import { PLANS, siteUrl, type PlanId } from "./stripe";

/**
 * Emails about advertising.
 *
 * Modelled on lib/notify.ts, with one difference that matters: that one is a
 * notification to ourselves and failing is merely annoying, because the
 * suggestion is already in the table. This one carries the only link an
 * advertiser has to the form where they set up what they have just paid for.
 *
 * So a failure here is not swallowed silently. It is logged loudly, and the
 * webhook that called it will report a failure, which makes Stripe retry —
 * and the row is written before the email is attempted, so a retry finds the
 * existing row and resends rather than charging or duplicating anything.
 *
 * If it still never arrives, the token is in the database and can be sent by
 * hand. That is the backstop, and it is why the token is stored rather than
 * derived.
 */

interface Sent {
  ok: boolean;
}

async function send(payload: Record<string, unknown>): Promise<Sent> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; advertiser email not sent.");
    return { ok: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.SUGGESTIONS_FROM ?? "OddWay <onboarding@resend.dev>",
        ...payload,
      }),
    });

    if (!response.ok) {
      console.error("Resend refused the message:", await response.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (caught) {
    console.error("Could not reach Resend:", caught);
    return { ok: false };
  }
}

/** The link to the form, to the person who paid. */
export async function notifyAdvertiser({
  email,
  token,
  plan,
}: {
  email: string;
  token: string;
  plan: PlanId;
}): Promise<void> {
  const link = `${siteUrl()}/advertise/submit/${token}`;
  const details = PLANS[plan];

  const lines = [
    "Thanks for advertising on OddWay.",
    "",
    `You are on ${details.name}, $${details.monthly} a month.`,
    "",
    "One more step: tell us what to show. This link opens a short form for",
    "your business name, your website, a line of description and your banner.",
    "",
    link,
    "",
    "The link works once and expires in seven days. If it runs out, reply to",
    "this email and we will send another.",
    "",
    "Nothing appears on the site until we have looked at it — usually the same",
    "day. You will hear from us when it is live.",
    "",
    "Cancel any time from the receipt Stripe sent you. Your advertisement runs",
    "to the end of the month you have paid for.",
  ];

  const { ok } = await send({
    to: [email],
    subject: "Your OddWay advertisement — one more step",
    text: lines.join("\n"),
  });

  if (!ok) {
    // Loud, and thrown: the webhook returns 500, Stripe retries, and the
    // read-back in the handler resends the same token rather than a new one.
    throw new Error(`Could not email the submission link to ${email}.`);
  }
}

/** And a note to whoever runs the index, so a sale is not a surprise. */
export async function notifyUsOfSale({
  email,
  plan,
}: {
  email: string;
  plan: PlanId;
}): Promise<void> {
  const to = process.env.ADVERTISING_EMAIL ?? process.env.SUGGESTIONS_EMAIL;
  if (!to) return;

  await send({
    to: [to],
    reply_to: email,
    subject: `OddWay advertising sale — ${PLANS[plan].name}`,
    text: [
      `${email} has subscribed to ${PLANS[plan].name} at $${PLANS[plan].monthly}/month.`,
      "",
      "They have been emailed a link to fill in their details. Nothing shows",
      "publicly until the row is set to active by hand.",
    ].join("\n"),
  });
}
