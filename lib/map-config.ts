/**
 * Basemap configuration.
 *
 * The default is OpenFreeMap's Positron style: OpenStreetMap data, no API key,
 * no registration, no cookies. Because there is no key, nothing here is secret
 * and NEXT_PUBLIC_ is safe.
 *
 * Free tile hosts do change their terms — CARTO's keyless endpoints started
 * serving "API KEY REQUIRED" watermarks to anonymous requests in 2026 — so the
 * URL is an environment variable and RouteMap surfaces load failures rather
 * than showing an empty box. If you switch to a provider that needs a key,
 * proxy tile requests through a route handler instead of putting the key here.
 */
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://tiles.openfreemap.org/styles/positron";

/** Central Appalachia — where the index currently has coverage. */
export const DEFAULT_CENTER: [number, number] = [-80.5, 39.0];

export const DEFAULT_ZOOM = 6;

/** Padding used when fitting the viewport to a route or a set of stops. */
export const FIT_PADDING = { top: 64, bottom: 96, left: 48, right: 48 };
