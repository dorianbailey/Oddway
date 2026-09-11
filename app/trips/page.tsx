import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getTrips, type Trip } from "@/lib/trips";
import { getStopsBySlugs } from "@/lib/stops";
import { stateName } from "@/lib/us-states";
import type { Stop } from "@/types/oddway";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Trips",
  description:
    "Ready-made routes through the strange: drives you can do in a weekend, and towns where everything worth seeing is on one street.",
};

export default async function TripsPage() {
  const trips = getTrips();

  /*
    Every stop the trips between them mention, and nothing else. This page was
    reading the entire index to show a handful of cards per trip.
  */
  const mentioned = [...new Set(trips.flatMap((trip) => trip.stops))];
  const stops = await getStopsBySlugs(mentioned);
  const bySlug = new Map(stops.map((stop) => [stop.slug, stop]));

  const drives = trips.filter((trip) => !trip.onFoot);
  const walks = trips.filter((trip) => trip.onFoot);

  function TripList({ list }: { list: Trip[] }) {
    return (
      <ul className="divide-y divide-contour/30 border-y border-contour/30">
        {list.map((trip) => {
          // Resolved from the database, so a closed or renamed stop shows up
          // here rather than silently misleading anyone.
          const resolved = trip.stops
            .map((slug) => bySlug.get(slug))
            .filter((stop): stop is Stop => stop !== undefined);
          const states = [...new Set(resolved.map((s) => s.state))];

          return (
            <li key={trip.slug} className="py-7">
              <h3 className="text-title">
                <Link
                  href={`/trips/${trip.slug}`}
                  className="underline-offset-4 hover:text-route hover:underline"
                >
                  {trip.title}
                </Link>
              </h3>
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
    );
  }

  /*
    Both sections start closed, so every heading is on screen at once and
    nobody has to scroll past fifteen drives to learn the walks exist.

    Native details/summary rather than a button and some state: the keyboard
    handling, the screen-reader announcement and the open/closed toggle all
    come free, and the page stays server rendered. A client component to
    collapse two lists would be a poor trade.
  */
  function Section({
    id,
    title,
    blurb,
    list,
    className = "",
  }: {
    id: string;
    title: string;
    blurb: string;
    list: Trip[];
    className?: string;
  }) {
    return (
      <details id={id} className={`group ${className}`}>
        <summary className="flex cursor-pointer list-none items-center gap-4 marker:content-['']">
          <h2 className="text-section">{title}</h2>
          <span className="rounded-full border border-contour/50 px-3 py-1 text-[0.85rem] text-ink-soft transition-colors group-hover:border-route group-hover:text-route">
            <span className="group-open:hidden">Show all {list.length}</span>
            <span className="hidden group-open:inline">Hide</span>
          </span>
        </summary>
        <p className="mt-4 max-w-[66ch] text-ink-soft">{blurb}</p>
        <div className="mt-8">
          <TripList list={list} />
        </div>
      </details>
    );
  }

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">Trips</h1>
        <p className="mt-6 max-w-[62ch] text-lede text-[#cfc9bb]">
          Routes that already make sense — a set of stops in an order that
          doesn&rsquo;t double back. Load one into the planner and it behaves
          like a trip you built yourself.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {trips.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            No trips published yet.
          </p>
        ) : (
          <>
            <Section
              id="driving"
              title="Road Trips"
              blurb="Close enough together to drive in one go, anything from an afternoon to a long weekend."
              list={drives}
            />

            {walks.length > 0 ? (
              <Section
                id="on-foot"
                title="Walking Trips"
                blurb="Towns where you park once and see the rest on foot. Usually old mining places, where everything was built along one street because there was nowhere else flat to build it."
                list={walks}
                className="mt-16"
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
