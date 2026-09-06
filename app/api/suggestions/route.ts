import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { notifySuggestion } from "@/lib/notify";

export const runtime = "nodejs";

const KINDS = new Set(["correction", "new_place", "new_event", "other"]);
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

/**
 * A public write endpoint is a spam magnet, so three cheap defences sit in
 * front of it: a honeypot field no human ever fills in, a length floor that
 * rejects one-word junk, and a per-instance rate cap.
 *
 * None of these are proper abuse protection. If it becomes a problem the
 * answer is a captcha or Supabase Edge Function with a shared rate limiter,
 * not more guessing here.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

let windowStart = Date.now();
let countInWindow = 0;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a hidden field. A person cannot see it; a bot fills everything.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    // Pretend it worked. Telling a bot it failed just invites a retry.
    return NextResponse.json({ ok: true });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < MIN_MESSAGE) {
    return NextResponse.json(
      { error: "Tell us a bit more — a sentence or two is plenty." },
      { status: 400 },
    );
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: "That's longer than we can take. Try trimming it down." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email && (email.length > 320 || !email.includes("@"))) {
    return NextResponse.json(
      { error: "That email address doesn't look right." },
      { status: 400 },
    );
  }

  const kind =
    typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : "other";
  const stopSlug =
    typeof body.stopSlug === "string" && body.stopSlug.length <= 100
      ? body.stopSlug
      : null;
  const category =
    typeof body.category === "string" && body.category.length <= 50
      ? body.category
      : null;

  if (!allowRequest()) {
    return NextResponse.json(
      { error: "Too many suggestions at once. Try again in a minute." },
      { status: 429 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Suggestions aren't set up on this server yet." },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("suggestions").insert({
    kind,
    stop_slug: stopSlug,
    category,
    message,
    email: email || null,
  });

  if (error) {
    console.error("Suggestion insert failed:", error.message);
    return NextResponse.json(
      { error: "Couldn't save that. Try again in a moment." },
      { status: 500 },
    );
  }

  /*
    Notify after the insert, never before. The database is the record; the
    email is a convenience. Awaiting it costs the visitor a moment but means a
    provider outage shows up in the logs rather than silently dropping mail.
  */
  await notifySuggestion({ kind, message, email: email || null, stopSlug, category });

  return NextResponse.json({ ok: true });
}

function allowRequest(): boolean {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    countInWindow = 0;
  }
  countInWindow += 1;
  return countInWindow <= MAX_PER_WINDOW;
}
