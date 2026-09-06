import { NextResponse } from "next/server";
import { findStopsNearRoute } from "@/lib/corridor";
import {
  geocodeCached,
  getRoutingProvider,
  RoutingProviderError,
} from "@/lib/providers";
import { getStopsNearBounds } from "@/lib/stops";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug } from "@/types/oddway";

/** Node runtime: the API key must never reach the edge cache or the client. */
export const runtime = "nodejs";

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.slug));
const MAX_QUERY_LENGTH = 200;

interface TripRequestBody {
  origin?: unknown;
  destination?: unknown;
  categories?: unknown;
  maxDetourMinutes?: unknown;
}

export async function POST(request: Request) {
  let body: TripRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send a JSON body with an origin and a destination." },
      { status: 400 },
    );
  }

  const origin = asQuery(body.origin);
  const destination = asQuery(body.destination);

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Both a starting point and a destination are required." },
      { status: 400 },
    );
  }

  const categories = asCategories(body.categories);
  const maxDetourMinutes = asDetourLimit(body.maxDetourMinutes);

  try {
    const provider = getRoutingProvider();

    // Sequential rather than parallel: free tiers cap concurrency, and this
    // lets us name which of the two places failed to resolve.
    /*
      "lat,lon" is accepted as an origin so the browser's own geolocation can
      be used directly. OpenRouteService's reverse endpoint is not on our plan,
      so there is no way to turn coordinates into a place name — but there is
      also no need to. The router only ever wanted a point.
    */
    const fromPoint = asCoordinates(origin);
    const from = fromPoint ?? (await geocodeCached(provider, origin, request.signal));
    if (!from) {
      return NextResponse.json(
        { error: `We couldn't find anywhere called "${origin}".`, field: "origin" },
        { status: 422 },
      );
    }

    const to = await geocodeCached(provider, destination, request.signal);
    if (!to) {
      return NextResponse.json(
        {
          error: `We couldn't find anywhere called "${destination}".`,
          field: "destination",
        },
        { status: 422 },
      );
    }

    const route = await provider.route(from, to, request.signal);

    // Narrow to the route's bounding box in the database before Turf does the
    // precise distance work. Keeps the corridor query viable as the index grows.
    const stops = await getStopsNearBounds(route.bounds, categories);

    return NextResponse.json({
      query: { origin: from.label, destination: to.label, categories, maxDetourMinutes },
      route,
      stops: findStopsNearRoute(stops, route.geometry, {
        maxDetourMinutes,
        categories,
      }),
      attribution: provider.attribution,
    });
  } catch (error) {
    if (error instanceof RoutingProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Log the detail server-side; never send provider internals to the client.
    console.error("Trip planning failed:", error);
    return NextResponse.json(
      { error: "Something went wrong planning that trip." },
      { status: 500 },
    );
  }
}

/**
 * Reads "42.1292,-80.0851" as a point, or returns null.
 *
 * Bounds are checked rather than assumed: a transposed pair, or a longitude
 * typed as a latitude, would otherwise route someone to the wrong hemisphere
 * without any error.
 */
function asCoordinates(value: string): { latitude: number; longitude: number; label: string } | null {
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return { latitude, longitude, label: "Your location" };
}

function asQuery(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_QUERY_LENGTH) return null;
  return trimmed;
}

function asCategories(value: unknown): CategorySlug[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is CategorySlug =>
      typeof item === "string" && VALID_CATEGORIES.has(item),
  );
}

function asDetourLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 30;
  return Math.min(Math.max(Math.round(value), 5), 180);
}
