import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Stop } from "@/types/oddway";

/**
 * Supabase access.
 *
 * The anon key is browser-safe by design: it grants only what Row Level
 * Security allows, which for `stops` is read-only. The service role key
 * bypasses RLS entirely and must never appear in client code or in any
 * NEXT_PUBLIC_ variable.
 *
 * When the environment isn't configured this returns null and `lib/stops.ts`
 * falls back to the demo data, so the app runs with no database at all.
 */

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  cached = url && key ? createClient(url, key, {
    auth: { persistSession: false },
  }) : null;

  return cached;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Columns to select. `geom` is excluded — it's for indexing, not the client. */
export const STOP_COLUMNS =
  "id, name, slug, category, latitude, longitude, city, state, description, public_access, image, source";

interface StopRow {
  id: string;
  name: string;
  slug: string;
  category: Stop["category"];
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  description: string;
  public_access: Stop["publicAccess"];
  image: string | null;
  source: string | null;
}

/**
 * Postgres uses snake_case, the app uses camelCase. Mapping here keeps that
 * detail from leaking into components.
 *
 * `detourMinutes` starts at 0 because it is not a stored value — the corridor
 * query computes it per route. See supabase/schema.sql.
 */
export function toStop(row: StopRow): Stop {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    latitude: row.latitude,
    longitude: row.longitude,
    city: row.city,
    state: row.state,
    description: row.description,
    detourMinutes: 0,
    publicAccess: row.public_access,
    image: row.image,
    source: row.source,
  };
}
