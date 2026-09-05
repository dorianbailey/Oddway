import type { CategorySlug, Stop } from "@/types/oddway";
import { DEMO_STOPS } from "./mock-data";
import { getSupabase, STOP_COLUMNS, toStop } from "./supabase";

/**
 * The single place the app reads stop data from.
 *
 * Every function queries Supabase when it is configured and falls back to the
 * demo entries when it is not, so the app runs with or without a database and
 * no caller has to know which.
 */

/** Degrees of padding round a route's bounding box, ~30km at these latitudes. */
const BBOX_PADDING_DEGREES = 0.3;

/** Every stop we have. Fine at this size; paginate once the index grows. */
export async function getStops(): Promise<Stop[]> {
  const supabase = getSupabase();
  if (!supabase) return [...DEMO_STOPS];

  const { data, error } = await supabase
    .from("stops")
    .select(STOP_COLUMNS)
    .order("name");

  if (error) {
    console.error("Supabase getStops failed:", error.message);
    return [...DEMO_STOPS];
  }

  return data.map(toStop);
}

/**
 * Stops inside a route's bounding box.
 *
 * This is the query that matters for the corridor search. Pulling the whole
 * table and filtering in JavaScript works at seven rows and falls over at
 * seventy thousand, so the coarse filter belongs in Postgres. Turf then does
 * the precise distance-to-line work on a much smaller set.
 *
 * The box is padded because a stop can sit outside the route's own bounds and
 * still be a short detour from it.
 */
export async function getStopsNearBounds(
  bounds: [number, number, number, number],
  categories: CategorySlug[] = [],
): Promise<Stop[]> {
  const [west, south, east, north] = bounds;
  const supabase = getSupabase();

  if (!supabase) {
    return [...DEMO_STOPS].filter(
      (stop) =>
        withinPaddedBounds(stop, west, south, east, north) &&
        (categories.length === 0 || categories.includes(stop.category)),
    );
  }

  let query = supabase
    .from("stops")
    .select(STOP_COLUMNS)
    .gte("longitude", west - BBOX_PADDING_DEGREES)
    .lte("longitude", east + BBOX_PADDING_DEGREES)
    .gte("latitude", south - BBOX_PADDING_DEGREES)
    .lte("latitude", north + BBOX_PADDING_DEGREES);

  if (categories.length > 0) {
    query = query.in("category", categories);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase getStopsNearBounds failed:", error.message);
    return [...DEMO_STOPS].filter((stop) =>
      withinPaddedBounds(stop, west, south, east, north),
    );
  }

  return data.map(toStop);
}

/** One stop by its URL slug, or null if there isn't one. */
export async function getStopBySlug(slug: string): Promise<Stop | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return DEMO_STOPS.find((stop) => stop.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("stops")
    .select(STOP_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Supabase getStopBySlug failed:", error.message);
    return DEMO_STOPS.find((stop) => stop.slug === slug) ?? null;
  }

  return data ? toStop(data) : null;
}

/**
 * Just enough of every stop to plot it. Sending 300-odd full records with
 * descriptions to the browser to draw dots on a map is a waste of everyone's
 * bandwidth.
 */
export async function getStopPins(): Promise<
  Array<Pick<Stop, "id" | "name" | "slug" | "category" | "latitude" | "longitude" | "city" | "state">>
> {
  const stops = await getStops();
  return stops.map(({ id, name, slug, category, latitude, longitude, city, state }) => ({
    id, name, slug, category, latitude, longitude, city, state,
  }));
}

/**
 * A rotating handful to feature on the homepage.
 *
 * Chosen by the date rather than at random: the same three all day means the
 * server and the browser agree, the page can still be cached, and someone who
 * refreshes twice doesn't get a reshuffle. It moves on tomorrow, so the whole
 * index gets a turn instead of the same three places forever.
 *
 * Only entries with a description are eligible. Featuring a blank card would
 * be advertising the gap.
 */
export async function getRecommendedStops(
  count = 3,
  today = new Date(),
): Promise<Stop[]> {
  const stops = await getStops();
  const eligible = stops.filter((stop) => stop.description?.trim());
  const pool = eligible.length >= count ? eligible : stops;

  if (pool.length === 0) return [];

  // Stable order first, so the rotation is reproducible run to run.
  const ordered = [...pool].sort((a, b) => a.id.localeCompare(b.id));

  const day = Math.floor(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) /
      86_400_000,
  );
  const start = (day * count) % ordered.length;

  return Array.from(
    { length: Math.min(count, ordered.length) },
    (_, i) => ordered[(start + i) % ordered.length],
  );
}

/** A small set for the homepage, to show what results look like. */
export async function getFeaturedStops(limit = 3): Promise<Stop[]> {
  const stops = await getStops();
  return stops.slice(0, limit);
}

/**
 * Every state we hold stops in, with counts, ordered by name.
 *
 * Derived from the stops themselves rather than a fixed list, so the filter
 * only ever offers states that actually have something in them. An empty
 * option is a dead end.
 */
export async function getStatesWithCounts(): Promise<
  Array<{ code: string; count: number }>
> {
  const stops = await getStops();
  const counts = new Map<string, number>();

  for (const stop of stops) {
    counts.set(stop.state, (counts.get(stop.state) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** How many stops sit in each category, for the explore index. */
export async function getCategoryCounts(): Promise<
  Partial<Record<CategorySlug, number>>
> {
  const stops = await getStops();
  return stops.reduce<Partial<Record<CategorySlug, number>>>((counts, stop) => {
    counts[stop.category] = (counts[stop.category] ?? 0) + 1;
    return counts;
  }, {});
}

function withinPaddedBounds(
  stop: Stop,
  west: number,
  south: number,
  east: number,
  north: number,
): boolean {
  const p = BBOX_PADDING_DEGREES;
  return (
    stop.longitude >= west - p &&
    stop.longitude <= east + p &&
    stop.latitude >= south - p &&
    stop.latitude <= north + p
  );
}
