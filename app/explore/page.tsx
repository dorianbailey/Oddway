import type { Metadata } from "next";
import Link from "next/link";
import { ExploreFilters } from "@/components/ExploreFilters";
import { PageHero } from "@/components/PageHero";
import { StopCard } from "@/components/StopCard";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { DataUnavailable } from "@/components/DataUnavailable";
import {
  countStops,
  findStops,
  getCategoryCounts,
  getStatesWithCounts,
} from "@/lib/stops";
import { isKnownState, stateName } from "@/lib/us-states";
import type {CategorySlug} from "@/types/oddway";

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

  const sections = selectedCategory
    ? CATEGORIES.filter((c) => c.slug === selectedCategory)
    : CATEGORIES;

  const PREVIEW_PER_CATEGORY = 6;
  const PER_PAGE = 24;
  const currentPage = Math.max(1, Number(page) || 1);

  /*
    Fetched per section, by the database, rather than pulling every stop and
    filtering here.

    This page used to load all five thousand records — about three and a half
    megabytes — to render twenty-four cards, on every request, and took four
    seconds doing it while the homepage took eighty milliseconds.

    In overview mode that is seven small queries running together, six rows
    each. With a category chosen it is one query for the page being looked at.
    Either way the count comes back with the rows, so pagination needs no
    second trip.
  */
  const [states, sectionResults] = await Promise.all([
    getStatesWithCounts(),
    Promise.all(
      sections.map((category) =>
        findStops({
          state: selectedState,
          category: category.slug,
          query,
          limit: selectedCategory ? PER_PAGE : PREVIEW_PER_CATEGORY,
          offset: selectedCategory ? (currentPage - 1) * PER_PAGE : 0,
        }),
      ),
    ),
  ]);

  const bySection = new Map(
    sections.map((category, i) => [category.slug, sectionResults[i]]),
  );

  const matchedTotal = sectionResults.reduce((sum, r) => sum + r.total, 0);

  /*
    Unavailable means the database answered with nothing at all, which is an
    outage rather than a filter that matched nothing. Distinguishing them
    matters: one deserves an apology and the other a suggestion.
  */
  const unavailable = matchedTotal === 0 && !selectedState && !selectedCategory && !query;

  const categoryCounts = await getCategoryCounts();
  // The whole index, for "showing 24 of 5,314" — a count, not a fetch.
  const totalStops = await countStops();

  /*
    Two shapes, because browsing and drilling in are different jobs.

    Without a category chosen the page is an overview: a handful from each
    section with a link to the rest. Rendering all of them meant 464KB of HTML
    and every card on the page before you had decided what you were looking
    for — slow on exactly the rural signal this site is used on.

    With a category chosen it becomes a list, and lists paginate.
  */
  const pageCount = selectedCategory
    ? Math.max(1, Math.ceil(matchedTotal / PER_PAGE))
    : 1;

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
            total={totalStops}
            matched={matchedTotal}
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {unavailable ? (
          <DataUnavailable />
        ) : matchedTotal === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            Nothing matches that.{" "}
            <Link href="/explore" className="underline underline-offset-4">
              Clear the filters
            </Link>{" "}
            and start again.
          </p>
        ) : (
          sections.map((category) => {
            const result = bySection.get(category.slug);
            const matches = result?.stops ?? [];
            const matchCount = result?.total ?? 0;
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
                    {/*
                      matchCount, not matches.length.

                      In overview mode each section fetches six rows as a
                      preview, so matches.length is always six and the heading
                      read "Cryptids 6" for a category holding eighty-four. It
                      looked like a total because it sat where a total goes.

                      matchCount is the count the query returned alongside the
                      rows, so it respects whatever state or search is applied
                      — which is what somebody reading it would assume.
                    */}
                    <span className="ml-3 align-middle text-[0.9rem] font-normal text-ink-soft">
                      {matchCount.toLocaleString()}
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

                {/* Overview mode: a way through to the rest of the section. */}
                {!selectedCategory && matchCount > PREVIEW_PER_CATEGORY ? (
                  <p className="mt-8">
                    <Link
                      href={withParams({ category: category.slug })}
                      className="font-semibold text-route underline underline-offset-4"
                    >
                      {/*
                        matchCount, not matches.length. The page now fetches
                        six per section, so matches.length is always six and
                        "See all 6" reads as though six is the total.
                      */}
                      See all {matchCount.toLocaleString()}{" "}
                      {category.label.toLowerCase()}
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
