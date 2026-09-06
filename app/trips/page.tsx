import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getTrips } from "@/lib/trips";
import { getStops } from "@/lib/stops";
import { stateName } from "@/lib/us-states";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Road trips",
  description:
    "Ready-made routes through the strange: ordered lists of stops that belong together, loadable straight into the trip planner.",
};

export default async function TripsPage() {
  const trips = getTrips();
  const stops = await getStops();
  const bySlug = new Map(stops.map((stop) => [stop.slug, stop]));

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">Road Trips</h1>
        <p className="mt-6 max-w-[62ch] text-lede text-[#cfc9bb]">
          Routes that already make sense — a set of stops close enough together
          to drive in one go, in an order that doesn&rsquo;t double back. Load
          one into the planner and it behaves like a trip you built yourself.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {trips.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            No trips published yet.
          </p>
        ) : (
          <ul className="divide-y divide-contour/30 border-y border-contour/30">
            {trips.map((trip) => {
              // Resolved from the database, so a closed or renamed stop shows
              // up here rather than silently misleading anyone.
              const resolved = trip.stops
                .map((slug) => bySlug.get(slug))
                .filter((stop) => stop !== undefined);
              const states = [...new Set(resolved.map((s) => s!.state))];

              return (
                <li key={trip.slug} className="py-7">
                  <h2 className="text-title">
                    <Link
                      href={`/trips/${trip.slug}`}
                      className="underline-offset-4 hover:text-route hover:underline"
                    >
                      {trip.title}
                    </Link>
                  </h2>
                  <p className="mt-2 max-w-[68ch] text-ink-soft">{trip.summary}</p>
                  <p className="mt-3 text-[0.9rem] text-ink-soft">
                    {resolved.length} stops
                    {trip.days ? ` · ${trip.days} days` : ""}
                    {states.length > 0
                      ? ` · ${states.map(stateName).join(", ")}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
