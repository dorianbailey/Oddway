import type { Stop } from "@/types/oddway";

export interface TripOrigin {
  label: string;
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance. Enough for ordering; no dependency needed. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Put the trip in a sensible driving order.
 *
 * Nearest-neighbour from the starting point: go to the closest stop, then the
 * closest one to that, and so on. It is a heuristic, not a guaranteed optimum
 * — finding the true shortest order is the travelling salesman problem — but
 * for the handful of corridor stops a road trip actually contains it produces
 * the order a person would pick themselves, and it never doubles back the way
 * click-order does.
 *
 * Straight-line distance, not driving distance. Ordering a dozen stops by road
 * would need a matrix call per plan, which is not worth the provider quota for
 * a result that would rarely differ.
 *
 * Without an origin the original order is preserved: there is no defensible
 * way to sequence a route when you don't know where it starts.
 */
export function orderStopsFrom(
  origin: TripOrigin | null,
  stops: Stop[],
  destination: TripOrigin | null = null,
): Stop[] {
  if (!origin || stops.length < 2) return stops;

  /*
    With both ends known, sequence by progress along the origin-to-destination
    corridor. That is what a road trip actually is, and unlike nearest
    neighbour it cannot strand a stop near the start to be revisited later.
  */
  if (destination) {
    const dx = destination.longitude - origin.longitude;
    const dy = destination.latitude - origin.latitude;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared > 0) {
      return [...stops].sort(
        (a, b) =>
          progressAlong(origin, dx, dy, lengthSquared, a) -
          progressAlong(origin, dx, dy, lengthSquared, b),
      );
    }
  }

  const remaining = [...stops];
  const ordered: Stop[] = [];
  let current: { latitude: number; longitude: number } = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    remaining.forEach((stop, index) => {
      const distance = distanceKm(current, stop);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}

/**
 * How far along the origin-to-destination line a stop sits, as a fraction.
 * Negative means behind the start, above one means past the finish; both sort
 * naturally to the ends where they belong.
 */
function progressAlong(
  origin: TripOrigin,
  dx: number,
  dy: number,
  lengthSquared: number,
  stop: Stop,
): number {
  const sx = stop.longitude - origin.longitude;
  const sy = stop.latitude - origin.latitude;
  return (sx * dx + sy * dy) / lengthSquared;
}

/** Rough straight-line length of the whole trip, for a sanity figure. */
export function tripDistanceKm(
  origin: TripOrigin | null,
  stops: Stop[],
  destination: TripOrigin | null = null,
): number {
  if (stops.length === 0) return 0;

  let total = 0;
  let current: { latitude: number; longitude: number } | null = origin;

  for (const stop of stops) {
    if (current) total += distanceKm(current, stop);
    current = stop;
  }

  if (destination && current) total += distanceKm(current, destination);

  return total;
}
