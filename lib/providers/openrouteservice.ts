import { RoutingProviderError, type RoutingProvider } from "./types";
import type { Route } from "@/types/oddway";

const BASE_URL = "https://api.openrouteservice.org";

/**
 * Bias suggestions to one country. Without this, "North E" surfaces North East
 * England well above North East, Pennsylvania. Set ORS_GEOCODE_COUNTRY to a
 * different ISO code, or empty to search worldwide.
 */
const COUNTRY_BIAS = process.env.ORS_GEOCODE_COUNTRY ?? "US";

/** Places, not shopfronts. Keeps "North East" from returning a dentist. */
const AUTOCOMPLETE_LAYERS = "locality,localadmin,borough,county,region,address";

const SUGGESTION_LIMIT = 6;

/**
 * OpenRouteService.
 *
 * The key is read from ORS_API_KEY and is deliberately NOT prefixed
 * NEXT_PUBLIC_, so it exists only on the server. Every call in this file runs
 * inside a route handler; nothing here is reachable from the browser.
 *
 * Free tier limits are cumulative across endpoints, so one search costs three
 * requests: two geocodes and one route. Geocode results are cached in
 * `lib/geocode-cache.ts` to keep repeat searches from burning quota.
 */
export function createOpenRouteServiceProvider(apiKey: string): RoutingProvider {
  return {
    name: "OpenRouteService",
    attribution: "Routing by OpenRouteService · Data © OpenStreetMap contributors",

    async geocode(query, signal) {
      const url = new URL("/geocode/search", BASE_URL);
      url.searchParams.set("text", query);
      url.searchParams.set("size", "1");

      const response = await fetch(url, {
        headers: { Authorization: apiKey, Accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        throw await providerError(response, "geocode");
      }

      const data = (await response.json()) as {
        features?: Array<{
          geometry?: { coordinates?: [number, number] };
          properties?: { label?: string };
        }>;
      };

      const feature = data.features?.[0];
      const coordinates = feature?.geometry?.coordinates;
      if (!feature || !coordinates) return null;

      const [longitude, latitude] = coordinates;
      return {
        label: feature.properties?.label ?? query,
        latitude,
        longitude,
      };
    },

    async reverseGeocode(latitude, longitude, signal) {
      const url = new URL("/geocode/reverse", BASE_URL);
      url.searchParams.set("point.lat", String(latitude));
      url.searchParams.set("point.lon", String(longitude));
      url.searchParams.set("size", "1");

      const response = await fetch(url, {
        headers: { Authorization: apiKey, Accept: "application/json" },
        signal,
      });

      if (!response.ok) throw await providerError(response, "geocode");

      const data = (await response.json()) as {
        features?: Array<{
          geometry?: { coordinates?: [number, number] };
          properties?: { label?: string };
        }>;
      };

      const feature = data.features?.[0];
      const label = feature?.properties?.label;
      if (!label) return null;

      // Keep the device's own coordinates: they are more precise than the
      // matched address, and the route should start where the person is.
      return { label, latitude, longitude };
    },

    /*
      Uses /geocode/search rather than /geocode/autocomplete.

      The autocomplete endpoint returns 403 on this key — it is not on the
      plan, and no amount of waiting changes that. Search accepts partial text
      and returns ranked results, so type-ahead still works; it is a little
      less forgiving of half-typed words, which is a fair trade for working.
    */
    async autocomplete(query, signal) {
      const url = new URL("/geocode/search", BASE_URL);
      url.searchParams.set("text", query);
      url.searchParams.set("size", String(SUGGESTION_LIMIT));
      url.searchParams.set("layers", AUTOCOMPLETE_LAYERS);
      if (COUNTRY_BIAS) url.searchParams.set("boundary.country", COUNTRY_BIAS);

      const response = await fetch(url, {
        headers: { Authorization: apiKey, Accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        throw await providerError(response, "suggestion");
      }

      const data = (await response.json()) as {
        features?: Array<{
          geometry?: { coordinates?: [number, number] };
          properties?: {
            label?: string;
            gid?: string;
            region?: string;
            county?: string;
            country?: string;
          };
        }>;
      };

      return (data.features ?? [])
        .map((feature) => {
          const coordinates = feature.geometry?.coordinates;
          const label = feature.properties?.label;
          if (!coordinates || !label) return null;

          const [longitude, latitude] = coordinates;
          return {
            id: feature.properties?.gid,
            label,
            context: [feature.properties?.county, feature.properties?.region]
              .filter(Boolean)
              .join(", "),
            latitude,
            longitude,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    },

    async routeVia(points, signal) {
      /*
        ORS caps waypoints per request. Fifty is far above anything a person
        would plan by hand, and failing clearly beats a truncated route drawn
        as though it were the whole thing.
      */
      if (points.length < 2) {
        throw new RoutingProviderError("A route needs at least two stops.", 400);
      }
      if (points.length > 50) {
        throw new RoutingProviderError(
          "That is more stops than we can route in one go. Try splitting the trip.",
          400,
        );
      }

      return requestRoute(
        points.map((p) => [p.longitude, p.latitude]),
        signal,
      );
    },

    async route(from, to, signal) {
      return requestRoute(
        [
          [from.longitude, from.latitude],
          [to.longitude, to.latitude],
        ],
        signal,
      );
    },
  };

  async function requestRoute(
    coordinates: number[][],
    signal?: AbortSignal,
  ): Promise<Route> {
      const response = await fetch(
        `${BASE_URL}/v2/directions/driving-car/geojson`,
        {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
            // The /geojson endpoint serves GeoJSON, not plain JSON. Asking for
            // application/json alone gets a 406 Not Acceptable.
            Accept: "application/geo+json, application/json;q=0.9",
          },
          body: JSON.stringify({
            coordinates,
            // Turn-by-turn manoeuvres, so directions can be shown inside
            // OddWay rather than handing the traveller to another app.
            instructions: true,
            instructions_format: "text",
          }),
          signal,
        },
      );

      if (!response.ok) {
        throw await providerError(response, "routing");
      }

      const data = (await response.json()) as {
        features?: Array<{
          geometry?: { coordinates?: [number, number][] };
          properties?: {
            summary?: { distance?: number; duration?: number };
            segments?: Array<{
              steps?: Array<{
                instruction?: string;
                distance?: number;
                duration?: number;
                name?: string;
              }>;
            }>;
          };
        }>;
        bbox?: number[];
      };

      const feature = data.features?.[0];
      const geometry = feature?.geometry?.coordinates;

      if (!geometry || geometry.length < 2) {
        throw new RoutingProviderError(
          "No driving route connects those places.",
          422,
        );
      }

      return {
        distanceMeters: feature.properties?.summary?.distance ?? 0,
        durationSeconds: feature.properties?.summary?.duration ?? 0,
        geometry,
        bounds: normaliseBounds(data.bbox, geometry),
        steps: (feature.properties?.segments ?? []).flatMap((segment) =>
          (segment.steps ?? []).map((step) => ({
            instruction: step.instruction ?? "Continue",
            distanceMeters: step.distance ?? 0,
            durationSeconds: step.duration ?? 0,
            // ORS uses "-" for unnamed roads.
            name: step.name && step.name !== "-" ? step.name : null,
          })),
        ),
      } satisfies Route;
  }
}

/**
 * Map provider failures onto messages worth showing a user.
 *
 * The provider's own error body is logged server-side, because "unavailable"
 * is useless when debugging — the real reason is almost always in there. The
 * API key is never logged and never reaches the client.
 */
async function providerError(
  response: Response,
  stage: string,
): Promise<RoutingProviderError> {
  const status = response.status;

  let detail = "";
  try {
    detail = (await response.text()).slice(0, 500);
  } catch {
    // Body already consumed or unreadable.
  }
  console.error(
    `[OpenRouteService] ${stage} failed — HTTP ${status}${detail ? `: ${detail}` : ""}`,
  );

  if (status === 401 || status === 403) {
    return new RoutingProviderError(
      "The routing service rejected our credentials. Check ORS_API_KEY.",
      500,
    );
  }
  if (status === 429) {
    return new RoutingProviderError(
      "We've hit today's routing quota. Try again later.",
      429,
    );
  }
  if (status === 400) {
    /*
      ORS returns 400 for two very different problems, and telling them apart
      matters: one is fixable by the traveller and one is not.

      Code 2004 means the request exceeded the plan's limits — almost always
      total distance. A trip from New Jersey to Utah is not a bad address, it
      is simply longer than the free plan will route, and telling someone to
      "try nearby towns" sends them looking for a fault that isn't there.
    */
    if (detail.includes("2004") || /exceed|maximum|limit/i.test(detail)) {
      return new RoutingProviderError(
        "That route is too long for the routing service to draw in one go. Try splitting it into a couple of shorter trips.",
        422,
      );
    }
    return new RoutingProviderError(
      "The routing service couldn't use one of those locations. Try a nearby town instead.",
      422,
    );
  }

  return new RoutingProviderError(
    `The ${stage} service is unavailable right now (HTTP ${status}).`,
    502,
  );
}

/** [west, south, east, north], computed from the line if the provider omits it. */
function normaliseBounds(
  bbox: number[] | undefined,
  geometry: [number, number][],
): [number, number, number, number] {
  if (bbox && bbox.length >= 4) {
    return [bbox[0], bbox[1], bbox[2], bbox[3]];
  }

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const [longitude, latitude] of geometry) {
    if (longitude < west) west = longitude;
    if (longitude > east) east = longitude;
    if (latitude < south) south = latitude;
    if (latitude > north) north = latitude;
  }

  return [west, south, east, north];
}
