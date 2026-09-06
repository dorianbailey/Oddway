import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadTripButton } from "@/components/LoadTripButton";
import { MapSection } from "@/components/MapSection";
import { PageHero } from "@/components/PageHero";
import { StructuredData } from "@/components/StructuredData";
import { getStops } from "@/lib/stops";
import { getTrip, getTrips } from "@/lib/trips";
import { distanceKm } from "@/lib/trip-order";
import { stateName } from "@/lib/us-states";

export const revalidate = 300;

interface TripPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getTrips().map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({
  params,
}: TripPageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = getTrip(slug);
  if (!trip) return { title: "Trip not found" };

  return {
    title: trip.title,
    description: trip.summary,
    openGraph: {
      title: `${trip.title} | OddWay`,
      description: trip.summary,
      images: ["/opengraph-image.jpg"],
    },
  };
}

export default async function TripPage({ params }: TripPageProps) {
  const { slug } = await params;
  const trip = getTrip(slug);
  if (!trip) notFound();

  const all = await getStops();
  const bySlug = new Map(all.map((stop) => [stop.slug, stop]));

  // Order comes from the file, not the database. The order is the route.
  const stops = trip.stops
    .map((s) => bySlug.get(s))
    .filter((stop) => stop !== undefined);

  const missing = trip.stops.length - stops.length;
  const states = [...new Set(stops.map((s) => s!.state))];

  /*
    Straight-line total between consecutive stops. Deliberately labelled as
    such: real road distance is longer, and calling this "driving distance"
    would understate every trip by a quarter or more.
  */
  let straightLineKm = 0;
  for (let i = 1; i < stops.length; i += 1) {
    straightLineKm += distanceKm(stops[i - 1]!, stops[i]!);
  }

  return (
    <>
      {/*
        TouristTrip with an itinerary, which is what a curated route actually
        is in schema terms. Each leg is a TouristAttraction with coordinates,
        so a search engine can place the trip rather than treat it as an
        article that happens to mention some towns.
      */}
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "TouristTrip",
          name: trip.title,
          description: trip.summary,
          url: `https://taketheoddway.com/trips/${trip.slug}`,
          itinerary: {
            "@type": "ItemList",
            numberOfItems: stops.length,
            itemListElement: stops.map((stop, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "TouristAttraction",
                name: stop!.name,
                url: `https://taketheoddway.com/stops/${stop!.slug}`,
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: stop!.latitude,
                  longitude: stop!.longitude,
                },
                address: {
                  "@type": "PostalAddress",
                  addressLocality: stop!.city,
                  addressRegion: stop!.state,
                  addressCountry: "US",
                },
              },
            })),
          },
        }}
      />

      <PageHero>
        <p className="text-[0.95rem] text-[#cfc9bb]">
          <Link href="/trips" className="underline underline-offset-4">
            Road trips
          </Link>
        </p>
        <h1 className="mt-4 max-w-[22ch] text-hero">{trip.title}</h1>
        <p className="mt-5 max-w-[60ch] text-lede text-[#cfc9bb]">
          {trip.summary}
        </p>
        <p className="mt-4 text-[0.95rem] text-[#cfc9bb]">
          {stops.length} stops
          {trip.days ? ` · ${trip.days} days` : ""}
          {states.length > 0 ? ` · ${states.map(stateName).join(", ")}` : ""}
          {` · roughly ${Math.round(straightLineKm * 0.621)} miles point to point`}
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <MapSection stops={stops} />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div
              className="article"
              dangerouslySetInnerHTML={{ __html: trip.html }}
            />

            <h2 className="mt-12 text-section">The Route</h2>
            <ol className="mt-6 space-y-7">
              {stops.map((stop, index) => (
                <li key={stop!.id} className="flex gap-5">
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-contour/50 font-body text-[0.9rem] font-semibold"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-title">
                      <Link
                        href={`/stops/${stop!.slug}`}
                        className="underline-offset-4 hover:text-route hover:underline"
                      >
                        {stop!.name}
                      </Link>
                    </h3>
                    <p className="text-[0.9rem] text-ink-soft">
                      {stop!.city}, {stateName(stop!.state)}
                    </p>
                    {stop!.description ? (
                      <p className="mt-2 max-w-[62ch] text-ink-soft">
                        {stop!.description}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>

            {missing > 0 ? (
              <p className="mt-8 border-l-2 border-contour pl-4 text-[0.95rem] text-ink-soft">
                {missing} {missing === 1 ? "stop on this route is" : "stops on this route are"}{" "}
                no longer in the index and have been left out.
              </p>
            ) : null}
          </div>

          <aside>
            <div className="sticky top-40 rounded-[4px] border border-contour/45 bg-paper-raised p-6">
              <h2 className="text-title">Take This Trip</h2>
              <p className="mt-3 text-[0.95rem] text-ink-soft">
                Loads all {stops.length} stops into the planner, where you can
                add your own start and finish, reorder them, and hand the whole
                route to Google Maps.
              </p>
              <div className="mt-5">
                <LoadTripButton stops={stops as never} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
