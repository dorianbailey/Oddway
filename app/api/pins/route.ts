import { NextResponse } from "next/server";
import { getStopPins } from "@/lib/stops";

/**
 * Every stop, trimmed to what a map pin needs.
 *
 * This used to be embedded in the homepage's HTML. At a few hundred stops that
 * was unremarkable; at 3,908 the homepage was a megabyte of markup before a
 * single image or script, and it grew with every state added — a page that
 * gets steadily slower as the project succeeds.
 *
 * Served from here instead, cached hard at the edge. The page ships in
 * kilobytes and the map fills in a moment later, which is the right order:
 * nobody reads the map before the page has drawn.
 */
export const revalidate = 300;

export async function GET() {
  const pins = await getStopPins();

  return NextResponse.json(
    { pins },
    {
      headers: {
        /*
          Five minutes fresh, a day stale-while-revalidate. Stops change a few
          times a day at most, and a map five minutes out of date is not a
          problem worth a database read per visitor.
        */
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}
