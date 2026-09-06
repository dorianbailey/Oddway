import type { Metadata } from "next";
import Link from "next/link";
import { ExploreFilters } from "@/components/ExploreFilters";
import { PageHero } from "@/components/PageHero";
import { StopCard } from "@/components/StopCard";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { DataUnavailable } from "@/components/DataUnavailable";
import { getStatesWithCounts, loadStops } from "@/lib/stops";
import { isKnownState, stateName } from "@/lib/us-states";
import type { CategorySlug, Stop } from "@/types/oddway";

interface ExplorePageProps {
  searchParams: Promise<{ state?: string; category?: string; q?: string; page?: string }>;
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
  const { state, category, q, page } = await searchParams;
  const selectedState = normaliseState(state);
  const selectedCategory = normaliseCategory(category);
  const query = (q ?? "").trim();

  const [{ stops: allStops, unavailable }, states] = await Promise.all([
    loadStops(),
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

  const sections = selectedCategory
    ? CATEGORIES.filter((c) => c.slug === selectedCategory)
    : CATEGORIES;

  /*
    Two shapes, because browsing and drilling in are different jobs.

    Without a category chosen the page is an overview: a handful from each
    section with a link to the rest. Rendering all of them meant 464KB of HTML
    and every card on the page before you had decided what you were looking
    for — slow on exactly the rural signal this site is used on.

    With a category chosen it becomes a list, and lists paginate.
  */
  const PREVIEW_PER_CATEGORY = 6;
  const PER_PAGE = 24;

  const currentPage = Math.max(1, Number(page) || 1);
  const pageCount = selectedCategory
    ? Math.max(1, Math.ceil(stops.length / PER_PAGE))
    : 1;
  const pageStart = (Math.min(currentPage, pageCount) - 1) * PER_PAGE;

  /** Keeps the other filters when building a link. */
  function withParams(next: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      q: query || undefined,
      category: selectedCategory ?? undefined,
      state: selectedState ?? undefined,
      ...next,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const search = params.toString();
    return search ? `/explore?${search}` : "/explore";
  }

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
        {unavailable ? (
          <DataUnavailable />
        ) : stops.length === 0 ? (
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
                  {(selectedCategory
                    ? matches.slice(pageStart, pageStart + PER_PAGE)
                    : matches.slice(0, PREVIEW_PER_CATEGORY)
                  ).map((stop) => (
                    <li key={stop.id} className="flex">
                      <StopCard stop={stop} />
                    </li>
                  ))}
                </ul>

                {/* Overview mode: a way through to the rest of the section. */}
                {!selectedCategory && matches.length > PREVIEW_PER_CATEGORY ? (
                  <p className="mt-8">
                    <Link
                      href={withParams({ category: category.slug })}
                      className="font-semibold text-route underline underline-offset-4"
                    >
                      See all {matches.length} {category.label.toLowerCase()}
                    </Link>
                  </p>
                ) : null}
              </section>
            );
          })
        )}

        {/*
          Page controls, only when a category is selected and there is more
          than one page. Plain links so they work without JavaScript and can
          be opened in a new tab.
        */}
        {selectedCategory && pageCount > 1 ? (
          <nav
            aria-label="Pagination"
            className="mt-12 flex items-center justify-between gap-4 border-t border-contour/40 pt-8"
          >
            {currentPage > 1 ? (
              <Link
                href={withParams({ page: currentPage - 1 === 1 ? undefined : currentPage - 1 })}
                rel="prev"
                className="rounded-[3px] border border-contour/50 px-4 py-2 font-semibold text-ink transition-colors hover:border-contour hover:bg-lichen/40"
              >
                &larr; Previous
              </Link>
            ) : (
              <span />
            )}

            <p className="text-[0.95rem] text-ink-soft">
              Page {Math.min(currentPage, pageCount)} of {pageCount}
            </p>

            {currentPage < pageCount ? (
              <Link
                href={withParams({ page: currentPage + 1 })}
                rel="next"
                className="rounded-[3px] border border-contour/50 px-4 py-2 font-semibold text-ink transition-colors hover:border-contour hover:bg-lichen/40"
              >
                Next &rarr;
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
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
