/**
 * Emails a suggestion to whoever runs the index.
 *
 * Suggestions land in Postgres either way — the email is a notification, not
 * the record. That ordering matters: if the mail provider is down, rate
 * limits, or the key is missing, the suggestion is still saved and nothing the
 * visitor did is lost. Every failure here is swallowed deliberately.
 *
 * Without RESEND_API_KEY set, this is a no-op and the site behaves exactly as
 * it did before: suggestions accumulate in the table for you to read.
 */

interface SuggestionEmail {
  kind: string;
  message: string;
  email?: string | null;
  stopSlug?: string | null;
  category?: string | null;
}

const KIND_LABELS: Record<string, string> = {
  correction: "Correction",
  new_place: "New place",
  new_event: "New event",
  other: "Suggestion",
};

export async function notifySuggestion(
  suggestion: SuggestionEmail,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUGGESTIONS_EMAIL;
  if (!apiKey || !to) return;

  const label = KIND_LABELS[suggestion.kind] ?? "Suggestion";
  const about = suggestion.stopSlug
    ? `about ${suggestion.stopSlug}`
    : suggestion.category
      ? `in ${suggestion.category}`
      : "";

  const lines = [
    `Kind: ${label}`,
    suggestion.stopSlug ? `Stop: ${suggestion.stopSlug}` : null,
    suggestion.category ? `Category: ${suggestion.category}` : null,
    // If they left an address, put it where you can hit reply.
    suggestion.email ? `From: ${suggestion.email}` : "From: (not given)",
    "",
    suggestion.message,
    "",
    suggestion.stopSlug
      ? `https://taketheoddway.com/stops/${suggestion.stopSlug}`
      : "https://taketheoddway.com/suggest",
  ].filter((line) => line !== null);

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.SUGGESTIONS_FROM ?? "OddWay <onboarding@resend.dev>",
        to: [to],
        // Reply goes to the person who wrote it, when they gave an address.
        ...(suggestion.email ? { reply_to: suggestion.email } : {}),
        subject: `OddWay ${label.toLowerCase()} ${about}`.trim(),
        text: lines.join("\n"),
      }),
    });
  } catch {
    // The suggestion is already saved. A failed notification is not worth
    // failing the request the visitor is waiting on.
  }
}
