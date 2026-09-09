import { lineString, point } from "@turf/helpers";
import length from "@turf/length";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import pointToLineDistance from "@turf/point-to-line-distance";
import type { CategorySlug, Stop } from "@/types/oddway";

/**
 * Assumed average speed on the roads leading off the route, in km/h.
 * Deliberately low: the roads to these places are rarely highways.
 */
const DETOUR_SPEED_KMH = 55;

/**
 * Flat minutes added for slowing down, parking, and getting back up to speed.
 * Without this, a stop 200m off the road looks free, which it isn't.
 */
const STOP_OVERHEAD_MINUTES = 4;

export interface RoutedStop extends Stop {
  /** Straight-line distance from the route to the stop, in kilometres. */
  distanceFromRouteKm: number;
  /** How far along the route you turn off, in kilometres. Used for ordering. */
  routePositionKm: number;
  /**
   * Reveal order, which is not reading order.
   *
   * Stops are picked one per stretch of road in rounds, so the lowest sixty
   * ranks are sixty spread end to end rather than sixty clustered at the
   * start. A "show me more" button reveals by this, and the list is read in
   * route order.
   */
  spreadRank?: number;
}

/**
 * Most stops to hand back from one search.
 *
 * Chosen as a number somebody might read rather than a technical limit. Sixty
 * is already a lot for one drive; the point of the cap is that the answer stays
 * usable, not that it stays small.
 */
const DEFAULT_LIMIT = 60;

/** How many stretches a long route is divided into when thinning. */
const SEGMENT_COUNT = 20;

export interface CorridorOptions {
  /** Drop stops that would cost more than this. */
  maxDetourMinutes?: number;
  /** Restrict to these categories. Empty or omitted means all of them. */
  categories?: CategorySlug[];
  /** Most stops to return. Beyond this they are spread along the route. */
  limit?: number;
}

/**
 * Find the stops worth leaving the route for.
 *
 * IMPORTANT — `detourMinutes` here is an estimate, not a routed figure. It is
 * derived from the straight-line distance between the stop and the route, so a
 * stop across a river or a ridge will read as closer than it drives. Getting
 * this exact means one routing call per candidate stop, which is the right
 * upgrade once a routing provider with real quota is in place.
 *
 * The estimate is deliberately pessimistic (low assumed speed, fixed overhead)
 * so it errs towards over-stating the cost rather than under-stating it.
 */
export function findStopsNearRoute(
  stops: Stop[],
  geometry: [number, number][],
  options: CorridorOptions = {},
): RoutedStop[] {
  const { maxDetourMinutes = 30, categories = [], limit = DEFAULT_LIMIT } = options;

  // A LineString needs at least two positions.
  if (geometry.length < 2) return [];

  const route = lineString(geometry);

  const candidates =
    categories.length > 0
      ? stops.filter((stop) => categories.includes(stop.category))
      : stops;

  const matching = candidates
    .map((stop) => {
      const location = point([stop.longitude, stop.latitude]);

      const distanceFromRouteKm = pointToLineDistance(location, route, {
        units: "kilometers",
      });

      const snapped = nearestPointOnLine(route, location, {
        units: "kilometers",
      });

      return {
        ...stop,
        distanceFromRouteKm,
        routePositionKm: snapped.properties.location ?? 0,
        detourMinutes: estimateDetourMinutes(distanceFromRouteKm),
      };
    })
    .filter((stop) => stop.detourMinutes <= maxDetourMinutes);

  return spreadAlongRoute(matching, limit);
}

/**
 * How many stops match, ignoring the display limit.
 *
 * Kept separate so a page can say "60 of 262" rather than silently showing a
 * slice. A number quietly capped is the sort of thing that reads as a thin
 * index when it is actually a busy corridor.
 */
export function countStopsNearRoute(
  stops: Stop[],
  geometry: [number, number][],
  options: CorridorOptions = {},
): number {
  return findStopsNearRoute(stops, geometry, {
    ...options,
    limit: Number.POSITIVE_INFINITY,
  }).length;
}

/**
 * Thin a long list down to something a person can actually read.
 *
 * Boston to Philadelphia matched 262 stops. Every one was genuinely within
 * half an hour of the road — the filter was right and the result was useless,
 * because nobody plans a trip from a list of 262 and the northeast is dense
 * enough that a straight cut would have returned two hundred of them within
 * sight of New York.
 *
 * So the route is divided into segments and the best few taken from each. A
 * traveller gets stops spread along the drive rather than a wall of them
 * around one city, and the ones they get are the closest to the road in their
 * stretch of it.
 *
 * Under the limit this does nothing at all, which is the common case.
 */
function spreadAlongRoute(stops: RoutedStop[], limit: number): RoutedStop[] {
  const byPosition = (a: RoutedStop, b: RoutedStop) =>
    a.routePositionKm - b.routePositionKm;

  /*
    Ranks are assigned even when everything fits.

    An earlier version returned early here and numbered stops in route order,
    which quietly made spreadRank the same as position for any route under the
    limit — including Boston to Philadelphia at 262 against a limit of 300. The
    "show me another sixty" button would then have walked out from the origin,
    which is the exact behaviour it exists to avoid, on the exact route that
    prompted it.

    So the spreading always runs. When nothing needs dropping the same stops
    come back, just carrying a useful reveal order.
  */
  const furthest = Math.max(...stops.map((s) => s.routePositionKm));
  /*
    Segments rather than a fixed distance, so a short dense route and a long
    one are both divided into the same number of chances to be picked.
  */
  const segments = Math.max(1, Math.min(limit, SEGMENT_COUNT));
  const segmentLength = furthest / segments || 1;

  const buckets = new Map<number, RoutedStop[]>();
  for (const stop of stops) {
    const index = Math.min(segments - 1, Math.floor(stop.routePositionKm / segmentLength));
    const bucket = buckets.get(index) ?? [];
    bucket.push(stop);
    buckets.set(index, bucket);
  }

  // Nearest the road first within each stretch, since that is the cheapest
  // stop to make there.
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.distanceFromRouteKm - b.distanceFromRouteKm);
  }

  /*
    Taken in rounds: one from every segment, then a second from every segment,
    and so on until the limit is reached. A segment with only one stop cannot
    starve a busy one, and a busy one cannot crowd out an empty stretch of
    road where a single stop is the only thing for fifty miles.
  */
  const chosen: RoutedStop[] = [];
  const ceiling = Math.min(limit, stops.length);
  for (let round = 0; chosen.length < ceiling; round += 1) {
    let tookAny = false;
    for (let index = 0; index < segments && chosen.length < ceiling; index += 1) {
      const bucket = buckets.get(index);
      const stop = bucket?.[round];
      if (stop) {
        /*
          spreadRank records the order stops were taken in, which is not the
          order they are read in. Revealing by rank means every batch covers
          the whole route: the first sixty are spread end to end, and so are
          the next sixty. Revealing by position would walk out from the start
          and leave somebody clicking six times to see anything near their
          destination.
        */
        chosen.push({ ...stop, spreadRank: chosen.length });
        tookAny = true;
      }
    }
    if (!tookAny) break;
  }

  return chosen.sort(byPosition);
}

/** Out and back, plus the cost of stopping at all. */
export function estimateDetourMinutes(distanceFromRouteKm: number): number {
  const travel = ((distanceFromRouteKm * 2) / DETOUR_SPEED_KMH) * 60;
  return Math.round(travel + STOP_OVERHEAD_MINUTES);
}

/** Total route length in kilometres. */
export function routeLengthKm(geometry: [number, number][]): number {
  if (geometry.length < 2) return 0;
  return length(lineString(geometry), { units: "kilometers" });
}
