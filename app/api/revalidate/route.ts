import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Tells the site that the index changed.
 *
 * getStops and getEvents are wrapped in unstable_cache and tagged, which means
 * every page that reads the whole index reads it through a cache living in
 * Vercel's Data Cache. Nothing was ever clearing that cache, so a state
 * imported through the SQL editor did not appear until the next deployment —
 * and because every import so far happened to be pushed alongside code, a
 * deploy always warmed a fresh cache and the numbers looked right.
 *
 * They were not right. The site spent a while claiming 2,433 places while
 * holding 2,711, and individual stop pages worked the whole time because they
 * query by slug and never touch this cache. That combination is the worst
 * shape of the bug: nothing 404s, nothing errors, the site simply understates
 * itself and there is no reason to look.
 *
 *   curl -X POST https://taketheoddway.com/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET"
 */

const TAGS = ["stops", "events"] as const;

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  /*
    Refuse rather than fall open. A missing secret means the endpoint is
    unconfigured, and an unconfigured cache-busting endpoint that works for
    anybody is a free way to make the site rebuild its caches on demand.
  */
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not set." },
      { status: 503 },
    );
  }

  const offered = request.headers.get("authorization");
  if (offered !== `Bearer ${secret}`) {
    // Deliberately says nothing about which part was wrong.
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  /*
    { expire: 0 } rather than a named profile.

    Next 16 requires a cache-life argument, and the named profiles all describe
    how long a fresh entry should live. What is wanted here is the opposite:
    treat what is cached as expired now, so the next request fetches. Passing a
    profile like "max" would mark the tag as long-lived and leave the stale
    entry in place, which is the bug rather than the fix.
  */
  for (const tag of TAGS) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({
    revalidated: TAGS,
    at: new Date().toISOString(),
  });
}

/** A GET is almost always somebody testing the URL in a browser. */
export function GET() {
  return NextResponse.json(
    { error: "Use POST with an Authorization header." },
    { status: 405 },
  );
}
