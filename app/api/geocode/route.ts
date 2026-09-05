import { NextResponse } from "next/server";
import {
  getRoutingProvider,
  RoutingProviderError,
  type GeocodeResult,
} from "@/lib/providers";

export const runtime = "nodejs";

/**
 * Below this, suggestions are noise and every keystroke costs quota.
 * The client enforces it too; this is the backstop.
 */
const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 120;

/**
 * Autocomplete is the one endpoint that fires while a person types, and the
 * ORS free tier is 2,500 requests/day cumulative across every endpoint. Two
 * defences sit in front of it:
 *
 *  1. A cache, because prefixes repeat constantly — "nor", "nort", "north"
 *     recur across users and across sessions.
 *  2. A crude per-instance rate cap, so a stuck client loop can't drain the
 *     day's quota in a minute.
 *
 * Both are per-instance and in-memory. On serverless they reset with the
 * instance, so treat them as damage limitation rather than a guarantee. Redis
 * or Postgres is the durable version.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 800;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

interface CacheEntry {
  value: GeocodeResult[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
let windowStartedAt = Date.now();
let requestsInWindow = 0;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  const key = query.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json({ suggestions: hit.value, cached: true });
  }

  if (!allowRequest()) {
    // Soft-fail: an empty list degrades to plain typing, which still works.
    return NextResponse.json({ suggestions: [], rateLimited: true });
  }

  try {
    const provider = getRoutingProvider();
    const suggestions = await provider.autocomplete(query, request.signal);

    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { value: suggestions, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({ suggestions });
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
