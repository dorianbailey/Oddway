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
}

export interface CorridorOptions {
  /** Drop stops that would cost more than this. */
  maxDetourMinutes?: number;
  /** Restrict to these categories. Empty or omitted means all of them. */
  categories?: CategorySlug[];
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
  const { maxDetourMinutes = 30, categories = [] } = options;

  // A LineString needs at least two positions.
  if (geometry.length < 2) return [];

  const route = lineString(geometry);

  const candidates =
    categories.length > 0
      ? stops.filter((stop) => categories.includes(stop.category))
      : stops;

  return candidates
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
    .filter((stop) => stop.detourMinutes <= maxDetourMinutes)
    .sort((a, b) => a.routePositionKm - b.routePositionKm);
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
