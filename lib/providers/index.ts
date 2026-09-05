import { createOpenRouteServiceProvider } from "./openrouteservice";
import { RoutingProviderError, type GeocodeResult, type RoutingProvider } from "./types";

export { RoutingProviderError };
export type { GeocodeResult, RoutingProvider };

/**
 * Build the configured provider.
 *
 * To switch services, write a new file satisfying RoutingProvider and return it
 * here. Nothing else in the app changes.
 */
export function getRoutingProvider(): RoutingProvider {
  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey) {
    throw new RoutingProviderError(
      "Route planning isn't configured on this server yet.",
      503,
    );
  }

  return createOpenRouteServiceProvider(apiKey);
}

/** Whether route planning can run at all. Used to keep the UI honest. */
export function isRoutingConfigured(): boolean {
  return Boolean(process.env.ORS_API_KEY);
}

/**
 * Geocode cache.
 *
 * Free-tier limits are cumulative across endpoints, and people search the same
 * handful of cities repeatedly, so caching lookups meaningfully extends the
 * quota. This is per-instance and in-memory: serverless instances are
 * short-lived, so treat it as opportunistic rather than reliable. A shared
 * cache in Postgres or Redis is the durable version.
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

interface CacheEntry {
  value: GeocodeResult | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function geocodeCached(
  provider: RoutingProvider,
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const key = query.trim().toLowerCase();
  const hit = cache.get(key);

  if (hit && hit.expiresAt > Date.now()) {
    return hit.value;
  }

  const value = await provider.geocode(query, signal);

  // Cheapest possible eviction: drop the oldest insertion when full.
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
