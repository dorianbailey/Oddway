import { NextResponse } from "next/server";
import {
  getRoutingProvider,
  RoutingProviderError,
  type GeocodeResult,
} from "@/lib/providers";
import { cachedLookup } from "@/lib/geocode-cache";
import { withinRateLimit } from "@/lib/rate-limit";

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
 *  3. A rate limit shared across instances, so a stuck client cannot drain
 *     the day's allowance in a minute. It counts only cache misses — a
 *     repeated prefix costs nothing and should not count against anybody.
 *
 * This matters because a bulk import once exhausted the geocoding quota and
 * took autocomplete down on the live site for a day.
 */

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
        /*
          Inside the cache callback on purpose: a prefix already in the cache
          costs no quota, so it should not count against anybody's allowance.
          Only a genuine trip to the provider does.

          Sixty an hour is generous for a person typing — autocomplete fires
          per keystroke, but the cache absorbs repeats, so sixty misses means
          sixty distinct places in an hour.
        */
        if (!(await withinRateLimit(request, "geocode", 60, 3600))) {
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

