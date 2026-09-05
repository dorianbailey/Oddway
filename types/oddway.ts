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
  | "private"
  /** Gone. Kept in the index so nobody drives there expecting otherwise. */
  | "closed";

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

  /** Raw OpenStreetMap `opening_hours` tag, parsed at render time. */
  openingHours: string | null;
  website: string | null;
  phone: string | null;
  /** OSM element this was reconciled against, e.g. "way/904768521". */
  osmRef: string | null;
  /** IANA timezone for the venue. Required to evaluate opening hours. */
  timezone: string | null;
}

/**
 * The minimum needed to plot a stop and label its popup.
 *
 * The map does not need descriptions, hours or sources, and sending several
 * hundred full records to the browser to draw dots would be wasteful.
 * `detourMinutes` is optional because it only exists once a route is planned.
 */
export type MapStop = Pick<
  Stop,
  "id" | "name" | "slug" | "category" | "latitude" | "longitude" | "city" | "state"
> & { detourMinutes?: number };

/** What the user asked for on the route search form. */
export interface RouteQuery {
  origin: string;
  destination: string;
  categories: CategorySlug[];
  /** How far off the direct route the user will tolerate, in minutes. */
  maxDetourMinutes?: number;
}

/** A single manoeuvre along a route. */
export interface RouteStep {
  /** Human instruction, e.g. "Turn left onto Main Street". */
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  /** Street or road being joined, when the provider gives one. */
  name: string | null;
}

/** A route as returned by the routing provider, ready for MapLibre and Turf. */
export interface Route {
  distanceMeters: number;
  durationSeconds: number;
  /** GeoJSON LineString coordinates: [longitude, latitude] pairs. */
  geometry: [number, number][];
  /** [west, south, east, north] — used to fit the map viewport. */
  bounds: [number, number, number, number];
  /** Turn-by-turn manoeuvres. Empty when the provider omits them. */
  steps: RouteStep[];
}

/** The full result of a search: the drawn route plus the stops found near it. */
export interface TripPlan {
  query: RouteQuery;
  route: Route;
  stops: Stop[];
}
