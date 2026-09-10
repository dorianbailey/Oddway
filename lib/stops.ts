import type { CategorySlug, Stop, MapStop } from "@/types/oddway";
import { DEMO_STOPS } from "./mock-data";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getSupabase, STOP_COLUMNS, toStop, type StopRow } from "./supabase";

/**
 * The single place the app reads stop data from.
 *
 * Every function queries Supabase when it is configured and falls back to the
 * demo entries when it is not, so the app runs with or without a database and
 * no caller has to know which.
 */

/** Degrees of padding round a route's bounding box, ~30km at these latitudes. */
const BBOX_PADDING_DEGREES = 0.3;

/*
  Every stop we have, deduplicated per request and cached across them.

  Several helpers here derive their answer from the full list — states with
  counts, category counts, recommendations — and each was issuing its own
  query. The explore page alone fetched all 165 rows twice per request, and
  the sitemap three times.

  React's cache() collapses those into one fetch for the duration of a single
  render. unstable_cache then holds the result across requests, so most
  visitors never wait for the database at all.

  Measured from Pennsylvania, a query to the database in AWS us-west-2 costs
  about 160ms before it returns a single byte, and roughly 240ms for the whole
  index. Trimming columns changed nothing — 128KB and 97KB both took 237ms —
  so the cost is distance, not payload, and no amount of tidying the SELECT
  will touch it.

  What does touch it is not asking. The index changes when an import runs, not
  between one visitor and the next, so a minute of staleness costs nothing and
  removes the round trip from almost every request.

  cache() still wraps this for per-request deduplication; the two layers do
  different jobs.
*/
const fetchStops = unstable_cache(
  async (): Promise<Stop[]> => {
    const supabase = getSupabase();
    // No credentials at all is a fresh checkout, not a failure.
    if (!supabase) return [...DEMO_STOPS];

    /*
      Read in pages, because PostgREST caps a response at 1,000 rows and says
      nothing about it. A single request returned the first thousand stops in
      name order and looked entirely successful — no error, no warning, and a
      site that had quietly stopped knowing about anything after the letter S.

      The failure is invisible from outside and gets worse as the index grows,
      so this loop is not a temporary measure. It is the only correct way to
      read a table that can outgrow a page.
    */
    const PAGE = 1000;
    const rows: StopRow[] = [];

    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("stops")
        .select(STOP_COLUMNS)
        .order("name")
        .range(from, from + PAGE - 1);

      if (error) {
        /*
          Deliberately not the demo data. Falling back to seven hardcoded
          entries made an outage look like a very small index: no error, no
          clue, just a site quietly claiming to know about seven places.
          Returning nothing lets the page say plainly that it could not load.
        */
        console.error("Supabase getStops failed:", error.message);
        return [];
      }

      rows.push(...(data as StopRow[]));
      if (data.length < PAGE) break; // A short page is the last page.
    }

    return rows.map(toStop);
  },
  ["stops:all"],
  { revalidate: 60, tags: ["stops"] },
);

export const getStops = cache(fetchStops);

/**
 * Map pins, fetched as pins rather than sliced out of the whole index.
 *
 * getStopPins used to call getStops and drop most of the columns. That worked
 * until the index passed about 2,500 stops, at which point the full record set
 * crossed 3.2MB — and Next silently refuses to cache anything over 2MB.
 *
 * Nothing failed. Nothing warned, outside the build log. The cache simply
 * stopped storing anything, so every page that touched the stop list did a
 * full read of the entire index on every request, and the site went from
 * quick to three seconds a page as the project got better.
 *
 * Asking for eight columns instead of twenty keeps this comfortably inside the
 * limit, so it caches again. The lesson is that a cache which fails by doing
 * nothing is worse than one that throws.
 */
const fetchStopPins = unstable_cache(
  async (): Promise<MapStop[]> => {
    const supabase = getSupabase();
    if (!supabase) {
      return DEMO_STOPS.map(({ id, name, slug, category, latitude, longitude, city, state }) => ({
        id, name, slug, category, latitude, longitude, city, state,
      }));
    }

    const PAGE = 1000;
    const rows: Array<Record<string, unknown>> = [];
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from("stops")
        .select("id, name, slug, category, latitude, longitude, city, state")
        .order("name")
        .range(offset, offset + PAGE - 1);

      if (error) {
        console.error("Supabase getStopPins failed:", error.message);
        return [];
      }
      rows.push(...data);
      if (data.length < PAGE) break;
    }

    return rows as unknown as MapStop[];
  },
  ["stops:pins"],
  { revalidate: 300, tags: ["stops"] },
);

/**
 * Totals, counted by the database rather than by loading every row.
 *
 * The homepage wants two numbers. Reading four thousand full records to call
 * .length on them was the reason a count cost a 3.2MB transfer.
 */
const fetchStopTotals = unstable_cache(
  async (): Promise<{ stops: number; states: number }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { stops: DEMO_STOPS.length, states: new Set(DEMO_STOPS.map((s) => s.state)).size };
    }

    const { count } = await supabase
      .from("stops")
      .select("id", { count: "exact", head: true });

    /*
      States still need the column, but one column across four thousand rows is
      a few tens of kilobytes rather than three megabytes.
    */
    const states = new Set<string>();
    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from("stops")
        .select("state")
        .range(offset, offset + PAGE - 1);
      if (error || !data) break;
      for (const row of data) states.add(row.state as string);
      if (data.length < PAGE) break;
    }

    return { stops: count ?? 0, states: states.size };
  },
  ["stops:totals"],
  { revalidate: 300, tags: ["stops"] },
);

/**
 * Stops, plus whether the load actually worked.
 *
 * An empty index and an unreachable database look identical to a caller that
 * only gets an array back, and they need completely different messages: one
 * says "nothing matches", the other says "this is our fault, try again".
 */
export async function loadStops(): Promise<{
  stops: Stop[];
  unavailable: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    // No credentials: a fresh checkout, not an outage.
    return { stops: [...DEMO_STOPS], unavailable: false };
  }

  const stops = await getStops();
  return { stops, unavailable: stops.length === 0 };
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

  /*
    Paged, because PostgREST caps a response at 1,000 rows without saying so.

    A wide bounding box across a dense region will pass that, and the failure
    would be a route quietly missing stops rather than an error — the same
    shape as the bug that had the whole site reading only its first thousand
    entries. It has not happened yet: Chicago to Denver is 283 stops today.
    It will.
  */
  const PAGE = 1000;
  const rows: unknown[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await query.range(offset, offset + PAGE - 1);
    if (error) {
      console.error("Supabase getStopsNearBounds failed:", error.message);
      return [...DEMO_STOPS].filter((stop) =>
        withinPaddedBounds(stop, west, south, east, north),
      );
    }
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return (rows as StopRow[]).map(toStop);
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
export async function getStopPins(): Promise<MapStop[]> {
  return fetchStopPins();
}

/**
 * Every slug, for the sitemap and for prerendering.
 *
 * One column across four thousand rows rather than every column: the sitemap
 * and generateStaticParams both wanted a list of slugs and were reading the
 * entire index to get one.
 */
export const getStopSlugs = unstable_cache(
  async (): Promise<Array<{ slug: string; verifiedAt: string | null }>> => {
    const supabase = getSupabase();
    if (!supabase) {
      return DEMO_STOPS.map((s) => ({ slug: s.slug, verifiedAt: s.verifiedAt }));
    }

    const PAGE = 1000;
    const rows: Array<{ slug: string; verified_at: string | null }> = [];
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from("stops")
        .select("slug, verified_at")
        .order("slug")
        .range(offset, offset + PAGE - 1);
      if (error || !data) break;
      rows.push(...(data as typeof rows));
      if (data.length < PAGE) break;
    }
    return rows.map((r) => ({ slug: r.slug, verifiedAt: r.verified_at }));
  },
  ["stops:slugs"],
  { revalidate: 300, tags: ["stops"] },
);

/**
 * Full records for a named handful of stops.
 *
 * Trips name their stops in a file, so a trip page wants twelve records, not
 * four thousand. It was loading the whole index and building a lookup map to
 * find them — which was the single largest read on the site and, at 3.2MB,
 * too big for Next to cache at all.
 */
export async function getStopsBySlugs(slugs: string[]): Promise<Stop[]> {
  if (slugs.length === 0) return [];

  const supabase = getSupabase();
  if (!supabase) {
    const wanted = new Set(slugs);
    return DEMO_STOPS.filter((stop) => wanted.has(stop.slug));
  }

  const { data, error } = await supabase
    .from("stops")
    .select("*")
    .in("slug", slugs);

  if (error || !data) {
    console.error("Supabase getStopsBySlugs failed:", error?.message);
    return [];
  }
  return (data as StopRow[]).map(toStop);
}

/** How many entries admit they are unverified. Used on the about page. */
export async function countUnverified(): Promise<number> {
  return (await getStopSlugs()).filter((s) => !s.verifiedAt).length;
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
  const supabase = getSupabase();
  if (!supabase) return DEMO_STOPS.slice(0, count);

  const { stops: total } = await fetchStopTotals();
  if (total === 0) return [];

  /*
    The rotation is unchanged — the same three all day, moving on tomorrow —
    but it now reads three rows instead of the whole index.

    Ordering by id in the database gives the same stable sequence the old
    in-memory sort did, so the offset lands on the same stops. Loading four
    thousand records to take three off the top was the reason the homepage
    could not use a cache.
  */
  const day = Math.floor(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) /
      86_400_000,
  );
  const start = ((day * count) % total + total) % total;

  const { data, error } = await supabase
    .from("stops")
    .select("*")
    .not("description", "is", null)
    .order("id")
    .range(start, start + count - 1);

  if (error || !data) return [];

  /*
    Near the end of the table the window runs off the edge, so the remainder
    comes from the beginning. Without this the last few days of each cycle
    would show fewer than three.
  */
  if (data.length < count) {
    const { data: wrapped } = await supabase
      .from("stops")
      .select("*")
      .not("description", "is", null)
      .order("id")
      .range(0, count - data.length - 1);
    return [...(data as StopRow[]), ...((wrapped ?? []) as StopRow[])].map(toStop);
  }

  return (data as StopRow[]).map(toStop);
}


/**
 * Every state we hold stops in, with counts, ordered by name.
 *
 * Derived from the stops themselves rather than a fixed list, so the filter
 * only ever offers states that actually have something in them. An empty
 * option is a dead end.
 */
export const getStatesWithCounts = unstable_cache(
  async (): Promise<Array<{ code: string; count: number }>> => {
    const supabase = getSupabase();
    const counts = new Map<string, number>();

    if (!supabase) {
      for (const stop of DEMO_STOPS) {
        counts.set(stop.state, (counts.get(stop.state) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => a.code.localeCompare(b.code));
    }

    /*
      One column rather than all of them. Counting states by loading every
      field of every stop is what pushed this past the cache limit.
    */
    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from("stops")
        .select("state")
        .range(offset, offset + PAGE - 1);
      if (error || !data) break;
      for (const row of data) {
        const code = row.state as string;
        counts.set(code, (counts.get(code) ?? 0) + 1);
      }
      if (data.length < PAGE) break;
    }

    return [...counts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => a.code.localeCompare(b.code));
  },
  ["stops:states"],
  { revalidate: 300, tags: ["stops"] },
);

/** How many stops sit in each category, for the explore index. */
export const getCategoryCounts = unstable_cache(
  async (): Promise<Partial<Record<CategorySlug, number>>> => {
    const supabase = getSupabase();
    const counts = new Map<CategorySlug, number>();

    const tally = (rows: ReadonlyArray<{ category: string }>) => {
      for (const row of rows) {
        const key = row.category as CategorySlug;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    };

    if (!supabase) {
      tally(DEMO_STOPS);
    } else {
      // One column. Counting categories by loading every field of every stop
      // is what kept this out of the cache.
      const PAGE = 1000;
      for (let offset = 0; ; offset += PAGE) {
        const { data, error } = await supabase
          .from("stops")
          .select("category")
          .range(offset, offset + PAGE - 1);
        if (error || !data) break;
        tally(data as Array<{ category: string }>);
        if (data.length < PAGE) break;
      }
    }

    // The same shape as before: a plain object keyed by category.
    return Object.fromEntries(counts) as Partial<Record<CategorySlug, number>>;
  },
  ["stops:category-counts"],
  { revalidate: 300, tags: ["stops"] },
);

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


/**
 * How many stops, and how many states they cover.
 *
 * Separate from getStopPins because the homepage only ever wanted two numbers
 * out of it. Calling the pins function for a length put the whole index into
 * the page's HTML — a megabyte of markup to render "3,908 places".
 */
export async function countStops(): Promise<number> {
  return (await fetchStopTotals()).stops;
}

export async function countStates(): Promise<number> {
  return (await fetchStopTotals()).states;
}
