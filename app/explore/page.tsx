import type { Metadata } from "next";
import Link from "next/link";
import { StateFilter } from "@/components/StateFilter";
import { StopCard } from "@/components/StopCard";
import { CATEGORIES } from "@/lib/categories";
import { getStatesWithCounts, getStops } from "@/lib/stops";
import { isKnownState, stateName } from "@/lib/us-states";

interface ExplorePageProps {
  searchParams: Promise<{ state?: string }>;
}

/**
 * The state filter lives in the URL rather than in client state, so a filtered
 * view can be shared, bookmarked and indexed. "Strange stops in West Virginia"
 * is a page worth having; a JavaScript toggle is not.
 */
export async function generateMetadata({
  searchParams,
}: ExplorePageProps): Promise<Metadata> {
  const { state } = await searchParams;
  const code = normaliseState(state);

  if (!code) {
    return {
      title: "Explore",
      description:
        "Browse the OddWay index by category: cryptids, folklore, haunted places, UFO history, weird history, museums and roadside oddities.",
    };
  }

  const name = stateName(code);
  return {
    title: `Strange stops in ${name}`,
    description: `Cryptids, haunted places, roadside oddities and unusual museums to visit in ${name}.`,
  };
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { state } = await searchParams;
  const selected = normaliseState(state);

  const [allStops, states] = await Promise.all([
    getStops(),
    getStatesWithCounts(),
  ]);

  const stops = selected
    ? allStops.filter((stop) => stop.state === selected)
    : allStops;

  return (
    <>
      <section className="map-grid border-b border-contour/30">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h1 className="max-w-[20ch] text-hero">
            {selected
              ? `Strange stops in ${stateName(selected)}`
              : "Explore the index"}
          </h1>
          <p className="mt-6 max-w-[62ch] text-lede text-ink-soft">
            {selected
              ? `${stops.length} ${stops.length === 1 ? "place" : "places"} in ${stateName(selected)}, sorted by what they are. Enough for a weekend without leaving the state.`
              : "Everything OddWay knows about, sorted by what it is. Pick a state if you'd rather stay close to home."}
          </p>
        </div>
      </section>

      <div className="border-b border-contour/30 bg-paper-sunk">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <StateFilter
            states={states}
            selected={selected}
            total={allStops.length}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {CATEGORIES.map((category) => {
          const matches = stops.filter(
            (stop) => stop.category === category.slug,
          );

          // With a state chosen, empty categories are noise rather than an
          // invitation — the visitor asked about one state, not the index.
          if (selected && matches.length === 0) return null;

          return (
            <section
              key={category.slug}
              id={category.slug}
              aria-labelledby={`${category.slug}-heading`}
              className="scroll-mt-28 border-t border-contour/40 py-10 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 id={`${category.slug}-heading`} className="text-section">
                  {category.label}
                  {matches.length > 0 ? (
                    <span className="ml-3 align-middle text-[0.9rem] font-normal text-ink-soft">
                      {matches.length}
                    </span>
                  ) : null}
                </h2>

                {/*
                  Per-category, because the moment someone notices a gap is
                  while they are looking at that part of the index.
                */}
                <Link
                  href={`/suggest?category=${category.slug}`}
                  className="rounded-[3px] border border-contour/50 px-4 py-2 text-[0.95rem] font-semibold text-ink transition-colors hover:border-contour hover:bg-lichen/40"
                >
                  Suggest a stop
                </Link>
              </div>

              <p className="mt-3 max-w-[58ch] text-ink-soft">
                {category.blurb}
              </p>

              {matches.length > 0 ? (
                <ul className="mt-8 grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((stop) => (
                    <li key={stop.id} className="flex">
                      <StopCard stop={stop} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-8 border-l-2 border-contour pl-4 text-ink-soft">
                  Nothing indexed here yet. This category fills in as we cover
                  more of the map.
                </p>
              )}
            </section>
          );
        })}

        {selected && stops.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            Nothing indexed in {stateName(selected)} yet.{" "}
            <Link href="/explore" className="underline underline-offset-4">
              Browse everything instead
            </Link>
            .
          </p>
        ) : null}
      </div>
    </>
  );
}

/** Only accept real two-letter codes; anything else falls back to all states. */
function normaliseState(value: string | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return isKnownState(code) ? code : null;
}
