import type { Category, CategorySlug } from "@/types/oddway";

/**
 * The seven categories OddWay indexes. Order is deliberate: it runs from the
 * most legendary to the most literal, which is also roughly how people browse.
 */
export const CATEGORIES: readonly Category[] = [
  {
    slug: "cryptids",
    label: "Cryptids",
    blurb: "Creatures people keep reporting and nobody has caught.",
  },
  {
    slug: "folklore",
    label: "Folklore",
    blurb: "Stories a place tells about itself, passed down and still repeated.",
  },
  {
    slug: "haunted",
    label: "Haunted",
    blurb: "Hotels, theatres, prisons and back roads with a reputation.",
  },
  {
    slug: "ufos",
    label: "UFOs",
    blurb: "Sighting sites, crash lore and the towns that kept the file open.",
  },
  {
    slug: "weird-history",
    label: "Weird history",
    blurb: "Real events too strange to have made the textbook.",
  },
  {
    slug: "museums",
    label: "Museums",
    blurb: "Small, specific collections run by people who care far too much.",
  },
  {
    slug: "roadside-oddities",
    label: "Roadside oddities",
    blurb: "Giant objects, odd monuments and things built for no clear reason.",
  },
] as const;

const CATEGORIES_BY_SLUG = new Map<CategorySlug, Category>(
  CATEGORIES.map((category) => [category.slug, category]),
);

/** Look up a category, or `undefined` if the slug is not one we index. */
export function getCategory(slug: CategorySlug): Category | undefined {
  return CATEGORIES_BY_SLUG.get(slug);
}

/** Display name for a category slug, falling back to the raw slug. */
export function categoryLabel(slug: CategorySlug): string {
  return CATEGORIES_BY_SLUG.get(slug)?.label ?? slug;
}
