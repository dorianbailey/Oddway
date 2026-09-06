import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { CategorySlug } from "@/types/oddway";

/**
 * The five ways in that we lead with. Fewer than the full category list on
 * purpose: this is a front door, not an index.
 */
const BROWSE: ReadonlyArray<{ slug: CategorySlug; heading: string }> = [
  { slug: "cryptids", heading: "Cryptids" },
  { slug: "haunted", heading: "Haunted places" },
  { slug: "ufos", heading: "UFO history" },
  { slug: "museums", heading: "Strange museums" },
  { slug: "roadside-oddities", heading: "Roadside oddities" },
];

interface ExploreCategoriesProps {
  /** Number of stops indexed per category. */
  counts: Partial<Record<CategorySlug, number>>;
}

export function ExploreCategories({ counts }: ExploreCategoriesProps) {
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
        {BROWSE.map(({ slug, heading }) => {
          const count = counts[slug] ?? 0;
          return (
            <li key={slug} className="border-b border-contour/40">
              <Link
                href={`/explore#${slug}`}
                className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 py-5 capitalize transition-colors hover:bg-lichen/25"
              >
                <span className="font-display text-title font-bold group-hover:text-route">
                  {heading}
                </span>
                <span className="text-ink-soft">
                  {getCategory(slug)?.blurb}
                </span>
                <span className="ml-auto shrink-0 text-[0.9rem] text-ink-soft">
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
