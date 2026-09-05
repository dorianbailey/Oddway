import { NextResponse } from "next/server";
import {
  getRoutingProvider,
  RoutingProviderError,
  type GeocodeResult,
} from "@/lib/providers";
import { cachedLookup } from "@/lib/geocode-cache";

export const runtime = "nodejs";

/**
 * Below this, suggestions are noise and every keystroke costs quota.
 * The client enforces it too; this is the backstop.
 */
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 120;

/**
 * Autocomplete is the one endpoint that fires while a person types, so it is
 * where provider quota actually goes. Three defences sit in front of it:
 *
 *  1. A three-character floor, enforced here as well as on the client.
 *  2. A shared cache in Postgres, so a prefix asked once is never asked again
 *     — the in-memory version only lasted as long as one serverless instance,
 *     which on Vercel meant almost no reuse at all.
 *  3. A crude per-instance rate cap, so a stuck client cannot drain the day's
 *     allowance in a minute.
 *
 * This matters because a bulk import once exhausted the geocoding quota and
 * took autocomplete down on the live site for a day.
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

let windowStartedAt = Date.now();
let requestsInWindow = 0;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await cachedLookup<GeocodeResult[]>(
      "autocomplete",
      query,
      async () => {
        if (!allowRequest()) {
          // Soft-fail: an empty list degrades to plain typing, which works.
          throw new RoutingProviderError("Busy. Try again shortly.", 429);
        }
        const provider = getRoutingProvider();
        return provider.autocomplete(query, request.signal);
      },
    );

    return NextResponse.json({ suggestions: suggestions ?? [] });
  } catch (error) {
    if (error instanceof RoutingProviderError) {
      // Suggestions are an enhancement — never block typing on them.
      return NextResponse.json({ suggestions: [], error: error.message });
    }
    console.error("Autocomplete failed:", error);
    return NextResponse.json({ suggestions: [] });
  }
}

function allowRequest(): boolean {
  const now = Date.now();
  if (now - windowStartedAt > RATE_LIMIT_WINDOW_MS) {
    windowStartedAt = now;
    requestsInWindow = 0;
  }
  requestsInWindow += 1;
  return requestsInWindow <= MAX_REQUESTS_PER_WINDOW;
}
