import { createOpenRouteServiceProvider } from "./openrouteservice";
import { cachedLookup } from "../geocode-cache";
import { RoutingProviderError, type GeocodeResult, type RoutingProvider } from "./types";

export { RoutingProviderError };
export type { GeocodeResult, RoutingProvider };

/**
 * Build the configured provider.
 *
 * To switch services, write a new file satisfying RoutingProvider and return it
 * here. Nothing else in the app changes.
 */
export function getRoutingProvider(): RoutingProvider {
  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey) {
    throw new RoutingProviderError(
      "Route planning isn't configured on this server yet.",
      503,
    );
  }

  return createOpenRouteServiceProvider(apiKey);
}

/** Whether route planning can run at all. Used to keep the UI honest. */
export function isRoutingConfigured(): boolean {
  return Boolean(process.env.ORS_API_KEY);
}

export async function geocodeCached(
  provider: RoutingProvider,
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  return cachedLookup("search", query, () => provider.geocode(query, signal));
}
