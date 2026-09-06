import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getStops, getStatesWithCounts } from "@/lib/stops";
import { getArticles } from "@/lib/articles";
import { getTrips } from "@/lib/trips";

/**
 * The sitemap, built from the database rather than a fixed list.
 *
 * Most of the site is stop pages, and there are enough of them that a crawler
 * would take a long time to find them all by following links from the
 * homepage. Generating this from the same query the pages use means it can
 * never drift out of date: import a hundred places and they are in the sitemap
 * on the next revalidation.
 *
 * Category and state views are listed too. They are real pages with their own
 * titles — "Haunted places in West Virginia" — and are often what somebody is
 * actually searching for.
 */
export const revalidate = 3600;

const SITE = "https://taketheoddway.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stops, states] = await Promise.all([getStops(), getStatesWithCounts()]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/events`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/stories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/trips`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/suggest`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE}/explore?category=${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Only states that actually hold stops. An empty page is a dead end for a
  // crawler and a dead end for a person.
  const statePages: MetadataRoute.Sitemap = states.map((state) => ({
    url: `${SITE}/explore?state=${state.code}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const stopPages: MetadataRoute.Sitemap = stops.map((stop) => ({
    url: `${SITE}/stops/${stop.slug}`,
    changeFrequency: "monthly",
    // Verified entries carry more weight: they have a source behind them.
    priority: stop.verifiedAt ? 0.7 : 0.5,
    lastModified: stop.verifiedAt ? new Date(stop.verifiedAt) : undefined,
  }));

  const articlePages: MetadataRoute.Sitemap = getArticles().map((article) => ({
    url: `${SITE}/stories/${article.slug}`,
    changeFrequency: "yearly",
    priority: 0.8,
    lastModified: new Date(article.date),
  }));

  const tripPages: MetadataRoute.Sitemap = getTrips().map((trip) => ({
    url: `${SITE}/trips/${trip.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    ...tripPages,
    ...staticPages,
    ...categoryPages,
    ...statePages,
    ...stopPages,
    ...articlePages,
  ];
}
