import { NextResponse } from "next/server";
import {
  geocodeCached,
  getRoutingProvider,
  RoutingProviderError,
  type GeocodeResult,
} from "@/lib/providers";

export const runtime = "nodejs";

interface DirectionsBody {
  /** Free-text place, or coordinates from the device. One or the other. */
  origin?: unknown;
  originLatitude?: unknown;
  originLongitude?: unknown;
  destinationLatitude?: unknown;
  destinationLongitude?: unknown;
  destinationName?: unknown;
}

/**
 * Directions to a single stop, for display inside OddWay.
 *
 * Deliberately not a navigation service: it returns the route and its
 * manoeuvres once. Live guidance, rerouting and traffic belong to the
 * device's navigation app, which the client hands off to only when the
 * traveller actually starts driving.
 */
export async function POST(request: Request) {
  let body: DirectionsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const destination = asPoint(
    body.destinationLatitude,
    body.destinationLongitude,
  );
  if (!destination) {
    return NextResponse.json(
      { error: "A destination is required." },
      { status: 400 },
    );
  }

  // Validate before touching the provider, so a missing origin reports as a
  // bad request rather than as a server configuration problem.
  const originPoint = asPoint(body.originLatitude, body.originLongitude);
  const originQuery =
    typeof body.origin === "string" ? body.origin.trim() : "";

  if (!originPoint && !originQuery) {
    return NextResponse.json(
      { error: "Tell us where you're starting from." },
      { status: 400 },
    );
  }

  try {
    const provider = getRoutingProvider();

    let from: GeocodeResult | null = originPoint;

    if (from) {
      // Turn coordinates into something a person recognises. Falls back to the
      // generic label if the lookup fails — a name is a nicety, not a
      // requirement for routing.
      try {
        const named = await provider.reverseGeocode(
          from.latitude,
          from.longitude,
          request.signal,
        );
        if (named) from = named;
      } catch {
        // Keep "Your location".
      }
    }

    if (!from) {
      const query = originQuery;
      from = await geocodeCached(provider, query, request.signal);
      if (!from) {
        return NextResponse.json(
          { error: `We couldn't find anywhere called "${query}".` },
          { status: 422 },
        );
      }
    }

    const to: GeocodeResult = {
      ...destination,
      label:
        typeof body.destinationName === "string"
          ? body.destinationName
          : destination.label,
    };

    const route = await provider.route(from, to, request.signal);

    return NextResponse.json({
      origin: from.label,
      destination: to.label,
      route,
      attribution: provider.attribution,
    });
  } catch (error) {
    if (error instanceof RoutingProviderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Directions failed:", error);
    return NextResponse.json(
      { error: "Something went wrong working out that route." },
      { status: 500 },
    );
  }
}

function asPoint(lat: unknown, lon: unknown): GeocodeResult | null {
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { label: "Your location", latitude: lat, longitude: lon };
}
