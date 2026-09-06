import type { Metadata } from "next";
import Link from "next/link";
import { ExploreFilters } from "@/components/ExploreFilters";
import { PageHero } from "@/components/PageHero";
import { StopCard } from "@/components/StopCard";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getStatesWithCounts, getStops } from "@/lib/stops";
import { isKnownState, stateName } from "@/lib/us-states";
import type { CategorySlug, Stop } from "@/types/oddway";

interface ExplorePageProps {
  searchParams: Promise<{ state?: string; category?: string; q?: string }>;
}

/**
 * Filters live in the URL, so a filtered view can be shared, bookmarked and
 * indexed. "Haunted places in West Virginia" is a page worth having; a
 * JavaScript toggle is not.
 */
export async function generateMetadata({
  searchParams,
}: ExplorePageProps): Promise<Metadata> {
  const { state, category } = await searchParams;
  const code = normaliseState(state);
  const kind = normaliseCategory(category);

  const what = kind ? getCategory(kind)?.label.toLowerCase() : "strange stops";
  const where = code ? ` in ${stateName(code)}` : "";

  if (!code && !kind) {
    return {
      title: "Explore",
      description:
        "Browse the OddWay index by category: cryptids, folklore, haunted places, UFO history, weird history, museums and roadside oddities.",
    };
  }

  return {
    title: `${what}${where}`,
    description: `Find ${what}${where} worth pulling off the road for.`,
  };
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { state, category, q } = await searchParams;
  const selectedState = normaliseState(state);
  const selectedCategory = normaliseCategory(category);
  const query = (q ?? "").trim();

  const [allStops, states] = await Promise.all([
    getStops(),
    getStatesWithCounts(),
  ]);

  const categoryCounts = allStops.reduce<Record<string, number>>(
    (counts, stop) => {
      counts[stop.category] = (counts[stop.category] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const stops = allStops.filter((stop) => {
    if (selectedState && stop.state !== selectedState) return false;
    if (selectedCategory && stop.category !== selectedCategory) return false;
    if (query && !matchesQuery(stop, query)) return false;
    return true;
  });

  // With a category chosen there is only ever one section, so the heading and
  // blurb would just repeat what the filter already says.
  const sections = selectedCategory
    ? CATEGORIES.filter((c) => c.slug === selectedCategory)
    : CATEGORIES;

  const heading = selectedCategory
    ? `${getCategory(selectedCategory)?.label}${selectedState ? ` in ${stateName(selectedState)}` : ""}`
    : selectedState
      ? `Strange stops in ${stateName(selectedState)}`
      : "Explore the index";

  return (
    <>
      <PageHero>
        <h1 className="max-w-[20ch] text-hero">{heading}</h1>
        <p className="mt-6 max-w-[62ch] text-lede text-[#cfc9bb]">
          {query
            ? `Everything matching “${query}”.`
            : "Everything OddWay knows about. Narrow it down by what you're after, or where you're going."}
        </p>
      </PageHero>

      <div className="border-b border-contour/30 bg-paper-sunk">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
          <ExploreFilters
            states={states}
            categoryCounts={categoryCounts}
            selectedState={selectedState}
            selectedCategory={selectedCategory}
            query={query}
            total={allStops.length}
            matched={stops.length}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {stops.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            Nothing matches that.{" "}
            <Link href="/explore" className="underline underline-offset-4">
              Clear the filters
            </Link>{" "}
            and start again.
          </p>
        ) : (
          sections.map((category) => {
            const matches = stops.filter(
              (stop) => stop.category === category.slug,
            );
            if (matches.length === 0) return null;

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
                    <span className="ml-3 align-middle text-[0.9rem] font-normal text-ink-soft">
                      {matches.length}
                    </span>
                  </h2>

                  <Link
                    href={`/suggest?category=${category.slug}`}
                    className="rounded-[3px] border border-contour/50 px-4 py-2 text-[0.95rem] font-semibold text-ink capitalize transition-colors hover:border-contour hover:bg-lichen/40"
                  >
                    Suggest a stop
                  </Link>
                </div>

                <p className="mt-3 max-w-[58ch] text-ink-soft">
                  {category.blurb}
                </p>

                <ul className="mt-8 grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((stop) => (
                    <li key={stop.id} className="flex">
                      <StopCard stop={stop} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}

/** Name, town, state and description all count as a match. */
function matchesQuery(stop: Stop, query: string): boolean {
  const needle = query.toLowerCase();
  return [stop.name, stop.city, stop.state, stateName(stop.state), stop.description]
    .filter(Boolean)
    .some((field) => field!.toLowerCase().includes(needle));
}

function normaliseState(value: string | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return isKnownState(code) ? code : null;
}

/** Only real category slugs; anything else falls back to everything. */
function normaliseCategory(value: string | undefined): CategorySlug | null {
  if (!value) return null;
  const slug = value.trim().toLowerCase() as CategorySlug;
  return CATEGORIES.some((c) => c.slug === slug) ? slug : null;
}
