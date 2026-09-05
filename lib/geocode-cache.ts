import { getSupabase } from "./supabase";
import type { GeocodeResult } from "./providers/types";

/**
 * Shared geocode cache.
 *
 * Two layers. The in-memory map makes repeated lookups within one instance
 * free; the Postgres table makes them free across instances, which is what
 * matters on serverless where every cold start would otherwise re-ask the
 * provider for "Pittsburgh".
 *
 * Place names do not change, so entries are kept for a long time. A null
 * result is cached too — a misspelling that returns nothing should not be
 * re-asked on every keystroke of every visitor.
 */

export type LookupKind = "search" | "autocomplete" | "reverse";

const MEMORY_TTL_MS = 60 * 60 * 1000;
const MAX_MEMORY_ENTRIES = 1000;
/** How long a database entry is trusted. Place names are stable. */
const DATABASE_TTL_DAYS = 30;

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

const memory = new Map<string, MemoryEntry>();

function key(kind: LookupKind, query: string): string {
  return `${kind}:${query.trim().toLowerCase()}`;
}

/**
 * Look up a cached answer, or compute and store one.
 *
 * Cache failures never propagate: a broken cache should make the site slower
 * and more expensive, not broken.
 */
export async function cachedLookup<T>(
  kind: LookupKind,
  query: string,
  compute: () => Promise<T>,
): Promise<T> {
  const cacheKey = key(kind, query);
  const normalised = query.trim().toLowerCase();

  const hit = memory.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  const supabase = getSupabase();

  if (supabase) {
    try {
      const cutoff = new Date(
        Date.now() - DATABASE_TTL_DAYS * 86_400_000,
      ).toISOString();

      const { data } = await supabase
        .from("geocode_cache")
        .select("result")
        .eq("query", normalised)
        .eq("kind", kind)
        .gte("created_at", cutoff)
        .maybeSingle();

      if (data) {
        remember(cacheKey, data.result);
        return data.result as T;
      }
    } catch {
      // Fall through and ask the provider.
    }
  }

  const value = await compute();
  remember(cacheKey, value);

  if (supabase) {
    try {
      await supabase
        .from("geocode_cache")
        .upsert(
          { query: normalised, kind, result: value ?? null, created_at: new Date().toISOString() },
          { onConflict: "query,kind" },
        );
    } catch {
      // Storing is best effort.
    }
  }

  return value;
}

function remember(cacheKey: string, value: unknown) {
  if (memory.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(cacheKey, { value, expiresAt: Date.now() + MEMORY_TTL_MS });
}

/** Convenience wrapper matching the old in-memory geocode helper. */
export async function cachedGeocode(
  query: string,
  compute: () => Promise<GeocodeResult | null>,
): Promise<GeocodeResult | null> {
  return cachedLookup("search", query, compute);
}
