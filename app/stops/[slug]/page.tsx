import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StopMap } from "@/components/StopMap";
import { OpeningHours } from "@/components/OpeningHours";
import { OpenNowBadge } from "@/components/OpenNowBadge";
import { PageHero } from "@/components/PageHero";
import { SourceLink } from "@/components/SourceLink";
import { StructuredData } from "@/components/StructuredData";
import { Directions } from "@/components/Directions";
import { AddToTripButton } from "@/components/AddToTripButton";
import { categoryLabel, getCategory } from "@/lib/categories";
import { formatAccess, formatCoordinates } from "@/lib/format";
import { getStopBySlug, getStops } from "@/lib/stops";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/*
  Prerender the stops known at build time, and regenerate periodically so
  newly imported places pick up their page without a redeploy. Slugs that
  did not exist at build are rendered on demand.
*/
export const revalidate = 300;

/** Prerender the stops known at build time; the rest render on request. */
export async function generateStaticParams() {
  const stops = await getStops();
  return stops.map((stop) => ({ slug: stop.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const stop = await getStopBySlug(slug);

  if (!stop) return { title: "Stop not found" };

  return {
    title: `${stop.name}, ${stop.city} ${stop.state}`,
    description: stop.description.slice(0, 155),
    /*
      images must be repeated here. Declaring an openGraph object on a page
      replaces the root one rather than merging into it, so the file-based
      share card is dropped — and a stop page is the single most likely URL
      for somebody to text to a friend.
    */
    openGraph: {
      title: `${stop.name} | OddWay`,
      description: stop.description.slice(0, 155),
      type: "article",
      images: ["/opengraph-image.jpg"],
    },
  };
}

export default async function StopPage({ params }: PageProps) {
  const { slug } = await params;
  const stop = await getStopBySlug(slug);

  if (!stop) notFound();

  const category = getCategory(stop.category);

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "TouristAttraction",
          name: stop.name,
          description: stop.description,
          url: `https://taketheoddway.com/stops/${stop.slug}`,
          geo: {
            "@type": "GeoCoordinates",
            latitude: stop.latitude,
            longitude: stop.longitude,
          },
          address: {
            "@type": "PostalAddress",
            addressLocality: stop.city,
            addressRegion: stop.state,
            addressCountry: "US",
          },
          ...(stop.openingHours ? { openingHours: stop.openingHours } : {}),
          ...(stop.website ? { sameAs: [stop.website] } : {}),
        }}
      />

      <PageHero>
        <p className="text-[0.95rem] text-[#cfc9bb]">
          <Link href="/explore" className="underline underline-offset-4">
            Explore
          </Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <Link
            href={`/explore#${stop.category}`}
            className="underline underline-offset-4"
          >
            {categoryLabel(stop.category)}
          </Link>
        </p>

        <h1 className="mt-4 max-w-[18ch] text-hero">{stop.name}</h1>
        <p className="mt-4 text-lede text-[#cfc9bb]">
          {stop.city}, {stop.state}
        </p>

        <OpenNowBadge
          openingHours={stop.openingHours}
          timezone={stop.timezone}
          className="mt-5"
        />
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="max-w-[68ch] text-lede">{stop.description}</p>

          {category ? (
            <p className="mt-8 max-w-[60ch] border-l-2 border-contour pl-4 text-ink-soft">
              Filed under {categoryLabel(stop.category).toLowerCase()}:{" "}
              {category.blurb.charAt(0).toLowerCase() + category.blurb.slice(1)}
            </p>
          ) : null}

          {/*
            Honest provenance. Every demo entry has source null, and saying so
            is better than letting an unverified description read as fact.
          */}
          {stop.osmRef ? (
            <p className="mt-4 text-[0.85rem] text-ink-soft">
              Practical details from{" "}
              <a
                href={`https://www.openstreetmap.org/${stop.osmRef}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                OpenStreetMap
              </a>
              , licensed ODbL.
            </p>
          ) : null}

          {/*
            A correction link where the problem is visible. Someone reading a
            stop page is the person most likely to know the hours are wrong.
          */}
          <p className="mt-6 text-[0.9rem]">
            <Link
              href={`/suggest?stop=${stop.slug}`}
              className="text-route underline underline-offset-4"
            >
              Something wrong with this entry?
            </Link>
          </p>

          <p className="mt-8 text-[0.9rem] text-ink-soft">
            {stop.source ? (
              <>
                Source: <SourceLink href={stop.source} />
              </>
            ) : (
              <>
                This entry hasn&rsquo;t been verified against a source yet.
                Check opening hours and access before you drive.
              </>
            )}
          </p>
        </div>

        <aside>
          <div className="overflow-hidden rounded-[4px] border border-contour/45">
            <div className="relative aspect-4/3">
              <StopMap stop={stop} />
            </div>
          </div>

          <dl className="mt-6 space-y-4 border-t border-contour/35 pt-5 text-[0.95rem]">
            <div>
              <dt className="text-ink-soft">Access</dt>
              <dd className="mt-0.5 font-semibold">
                {formatAccess(stop.publicAccess)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-soft">Coordinates</dt>
              <dd className="mt-0.5 font-display italic">
                {formatCoordinates(stop.latitude, stop.longitude)}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <OpeningHours
              value={stop.openingHours}
              website={stop.website}
              phone={stop.phone}
            />
          </div>

          <AddToTripButton stop={stop} className="mt-6" />

          {/*
            Stays inside OddWay. The handoff to a native maps app lives in the
            directions section below, offered only once a route exists.
          */}
          <a
            href="#directions-heading"
            className="mt-3 block rounded-[3px] border border-contour/50 px-4 py-2.5 text-center font-semibold text-ink transition-colors hover:bg-lichen/40"
          >
            Get directions
          </a>
        </aside>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
        <Directions stop={stop} />
      </div>
    </>
  );
}
