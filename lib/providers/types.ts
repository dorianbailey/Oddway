import type { Route } from "@/types/oddway";

export interface GeocodeResult {
  /** Human-readable name of what we matched, shown back to the user. */
  label: string;
  latitude: number;
  longitude: number;
  /** Stable id from the provider, used as a React key. */
  id?: string;
  /** Coarser context line, e.g. "Erie County, Pennsylvania". */
  context?: string;
}

/**
 * What OddWay needs from a geocoding + routing service.
 *
 * Keeping this narrow is the point: swapping OpenRouteService for Geoapify,
 * Stadia, Mapbox or a self-hosted Valhalla means writing one new file that
 * satisfies this interface and changing one line in `getRoutingProvider`.
 * Nothing above this layer knows which service is in use.
 */
export interface RoutingProvider {
  readonly name: string;
  /** Attribution string that must be shown wherever routes are displayed. */
  readonly attribution: string;
  /** Resolve a free-text place into coordinates, or null if nothing matched. */
  geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult | null>;
  /** Type-ahead suggestions for a partial query. Ordered best-first. */
  autocomplete(query: string, signal?: AbortSignal): Promise<GeocodeResult[]>;
  /** Coordinates to a place name, so device location can be named on screen. */
  reverseGeocode(
    latitude: number,
    longitude: number,
    signal?: AbortSignal,
  ): Promise<GeocodeResult | null>;
  /** Driving route between two points. */
  route(
    from: GeocodeResult,
    to: GeocodeResult,
    signal?: AbortSignal,
  ): Promise<Route>;
}

/** Thrown when a provider fails in a way worth showing the user. */
export class RoutingProviderError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
  ) {
    super(message);
    this.name = "RoutingProviderError";
  }
}
