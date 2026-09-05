/**
 * Units.
 *
 * OddWay is a US road-trip product, so imperial is the default. Everything is
 * stored and calculated in metric — metres, kilometres, km/h — and converted
 * only at the point of display. Keeping one system internally is what stops
 * unit bugs creeping into the geometry in `lib/corridor.ts`.
 */

export type UnitSystem = "imperial" | "metric";

export const DEFAULT_UNITS: UnitSystem = "imperial";

const METERS_PER_MILE = 1609.344;
const METERS_PER_FOOT = 0.3048;
const METERS_PER_KM = 1000;

/** Below this, "0.05 miles" is useless and "260 feet" is meaningful. */
const FEET_THRESHOLD_METERS = 0.1 * METERS_PER_MILE;

/** Countries using imperial for road distances. */
const IMPERIAL_REGIONS = new Set(["US", "LR", "MM"]);

export function isUnitSystem(value: unknown): value is UnitSystem {
  return value === "imperial" || value === "metric";
}

/**
 * Opening guess from the browser locale. An explicit choice always wins and is
 * remembered, so this only matters on a first visit.
 */
export function detectUnitSystem(): UnitSystem {
  if (typeof navigator === "undefined") return DEFAULT_UNITS;

  try {
    const tags = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];

    for (const tag of tags) {
      const region = new Intl.Locale(tag).maximize().region;
      if (!region) continue;
      return IMPERIAL_REGIONS.has(region) ? "imperial" : "metric";
    }
  } catch {
    // Malformed locale tag — fall through to the default.
  }

  return DEFAULT_UNITS;
}

/** A road distance in the units the reader thinks in. */
export function formatDistance(meters: number, system: UnitSystem): string {
  if (!Number.isFinite(meters) || meters < 0) meters = 0;

  if (system === "imperial") {
    if (meters < FEET_THRESHOLD_METERS) {
      return `${roundTo(meters / METERS_PER_FOOT, 10).toLocaleString("en-US")} ft`;
    }
    const shown = formatMagnitude(meters / METERS_PER_MILE);
    return `${shown} ${shown === "1" ? "mile" : "miles"}`;
  }

  const roundedMeters = roundTo(meters, 10);
  if (roundedMeters < METERS_PER_KM) {
    return `${roundedMeters.toLocaleString("en-US")} m`;
  }
  return `${formatMagnitude(meters / METERS_PER_KM)} km`;
}

/** The corridor query works in kilometres throughout. */
export function formatDistanceFromKm(km: number, system: UnitSystem): string {
  return formatDistance(km * METERS_PER_KM, system);
}

/** How far off the route a stop sits, phrased as a cost. */
export function formatOffRoute(km: number, system: UnitSystem): string {
  return `${formatDistanceFromKm(km, system)} off route`;
}

/** Speed, for anywhere we explain how the detour estimate is derived. */
export function formatSpeed(kmh: number, system: UnitSystem): string {
  if (system === "metric") return `${Math.round(kmh)} km/h`;
  return `${Math.round((kmh * METERS_PER_KM) / METERS_PER_MILE)} mph`;
}

export const UNIT_LABELS: Record<UnitSystem, string> = {
  imperial: "Miles",
  metric: "Kilometres",
};

/** One decimal below ten, whole numbers above — how people say distances. */
function formatMagnitude(value: number): string {
  if (value < 10) return value.toFixed(1).replace(/\.0$/, "");
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Round to a readable step. Zero stays zero: a stop on the route itself must
 * not read as "10 ft away".
 */
function roundTo(value: number, step: number): number {
  if (value <= 0) return 0;
  return Math.max(step, Math.round(value / step) * step);
}
