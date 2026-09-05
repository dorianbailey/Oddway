/**
 * Domain types for OddWay.
 *
 * These are the shapes the UI already renders against. When the Postgres
 * schema lands, the table columns should match `Stop` field-for-field so the
 * mock data in `lib/mock-data.ts` can be swapped out without touching a
 * component.
 */

export type CategorySlug =
  | "cryptids"
  | "folklore"
  | "haunted"
  | "ufos"
  | "weird-history"
  | "museums"
  | "roadside-oddities";

export interface Category {
  slug: CategorySlug;
  /** Display name used on filters, cards and the explore index. */
  label: string;
  /** One line explaining what belongs in this category. */
  blurb: string;
}

/** How much effort it takes to actually get to a stop. */
export type PublicAccess =
  /** Open to visitors, usually with posted hours. */
  | "open"
  /** Visitable, but seasonal, ticketed, or by appointment. */
  | "limited"
  /** Visible from a public road or pull-off; nothing to enter. */
  | "roadside"
  /** On private land — view from the road only. */
  | "private";

export interface Stop {
  id: string;
  name: string;
  /** URL segment, e.g. `mothman-museum`. Unique across all stops. */
  slug: string;
  category: CategorySlug;
  latitude: number;
  longitude: number;
  city: string;
  /** Two-letter US state or territory code. */
  state: string;
  description: string;
  /** Minutes added to the base route by detouring to this stop. */
  detourMinutes: number;
  publicAccess: PublicAccess;
  /** Path or absolute URL of a licensed image, or null if we have none. */
  image: string | null;
  /** Where the entry came from, for attribution and verification. */
  source: string | null;
}

/** What the user asked for on the route search form. */
export interface RouteQuery {
  origin: string;
  destination: string;
  categories: CategorySlug[];
  /** How far off the direct route the user will tolerate, in minutes. */
  maxDetourMinutes?: number;
}

/** A route as returned by the routing provider, ready for MapLibre and Turf. */
export interface Route {
  distanceMeters: number;
  durationSeconds: number;
  /** GeoJSON LineString coordinates: [longitude, latitude] pairs. */
  geometry: [number, number][];
  /** [west, south, east, north] — used to fit the map viewport. */
  bounds: [number, number, number, number];
}

/** The full result of a search: the drawn route plus the stops found near it. */
export interface TripPlan {
  query: RouteQuery;
  route: Route;
  stops: Stop[];
}
