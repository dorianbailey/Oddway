import { ExploreCategories } from "@/components/ExploreCategories";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { TripPlanner } from "@/components/TripPlanner";
import { getCategoryCounts, getRecommendedStops, getStopPins } from "@/lib/stops";

/*
  Revalidate rather than prerender once.

  The homepage reads the whole index, and the index changes every time an
  import runs. Baking it at build time meant the map kept showing whatever
  existed when the build happened — seven demo stops long after the database
  held hundreds. A minute of caching keeps it fast without going stale.
*/
export const revalidate = 60;

export default async function HomePage() {
  const [recommended, allStops, categoryCounts] = await Promise.all([
    getRecommendedStops(3),
    getStopPins(),
    getCategoryCounts(),
  ]);

  return (
    <>
      <Hero />

      <TripPlanner fallbackStops={recommended} allStops={allStops} />

      <HowItWorks />

      <ExploreCategories counts={categoryCounts} />
    </>
  );
}
