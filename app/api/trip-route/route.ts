import { NextResponse } from "next/server";
import { getRoutingProvider, RoutingProviderError } from "@/lib/providers";

export const runtime = "nodejs";

/**
 * Draws a saved trip as a route.
 *
 * Distinct from /api/trip, which geocodes an origin and destination and then
 * searches a corridor. Here the stops are already chosen and already ordered —
 * all that is wanted is the line between them.
 */
export async function POST(request: Request) {
  let body: { points?: Array<{ latitude: number; longitude: number }> };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const points = (body.points ?? []).filter(
    (p) =>
      typeof p?.latitude === "number" &&
      typeof p?.longitude === "number" &&
      Math.abs(p.latitude) <= 90 &&
      Math.abs(p.longitude) <= 180,
  );

  if (points.length < 2) {
    return NextResponse.json(
      { error: "Add at least two stops to draw a route." },
      { status: 400 },
    );
  }

  try {
    const provider = getRoutingProvider();
    const route = await provider.routeVia(points, request.signal);
    return NextResponse.json({ route });
  } catch (error) {
    if (error instanceof RoutingProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Trip route failed:", error);
    return NextResponse.json(
      { error: "Couldn't draw that route. Try again in a moment." },
      { status: 502 },
    );
  }
}
