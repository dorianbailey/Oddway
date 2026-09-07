import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug } from "@/types/oddway";

interface ExploreCategoriesProps {
  /** Number of stops indexed per category. */
  counts: Partial<Record<CategorySlug, number>>;
}

/**
 * The front door to the index, one row per category.
 *
 * Derived from CATEGORIES rather than a hand-written list. The hand-written
 * version named five categories, chosen when folklore and weird history held a
 * single stop each; they now hold over a hundred between them and were still
 * missing from the homepage. A list that has to be updated by hand eventually
 * is not.
 *
 * Empty categories are hidden, so this stays a front door rather than an
 * inventory of what we do not have yet.
 */
export function ExploreCategories({ counts }: ExploreCategoriesProps) {
  const shown = CATEGORIES.filter((category) => (counts[category.slug] ?? 0) > 0);

  return (
    <section
      id="explore"
      aria-labelledby="explore-heading"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
    >
      <h2 id="explore-heading" className="max-w-[22ch] text-section">
        Or skip the route and just go looking
      </h2>
      <p className="mt-5 max-w-[58ch] text-lede text-ink-soft">
        Browse the whole index by what you&rsquo;re after. Plenty of trips start
        with one specific thing you want to see.
      </p>

      <ul className="mt-10 border-t border-contour/40">
        {shown.map((category) => {
          const count = counts[category.slug] ?? 0;
          return (
            <li key={category.slug} className="border-b border-contour/40">
              {/*
                Links to the filtered view rather than an anchor. Jumping to a
                heading still loads every category below it; the filter shows
                only what was asked for.
              */}
              <Link
                href={`/explore?category=${category.slug}`}
                className="group flex items-baseline gap-x-6 py-5 capitalize transition-colors hover:bg-lichen/25"
              >
                {/*
                  Title and blurb share the flexible column so the blurb wraps
                  under long titles; the count is fixed and never breaks onto a
                  line of its own, which is what it was doing.
                */}
                <span className="flex flex-1 flex-wrap items-baseline gap-x-5 gap-y-1">
                  <span className="font-display text-title font-bold group-hover:text-route">
                    {category.label}
                  </span>
                  <span className="text-ink-soft">{category.blurb}</span>
                </span>

                <span className="shrink-0 text-[0.9rem] whitespace-nowrap text-ink-soft">
                  {count === 1 ? "1 stop" : `${count} stops`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
