import { ExploreCategories } from "@/components/ExploreCategories";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { TripPlanner } from "@/components/TripPlanner";
import {
  countStates,
  countStops,
  getCategoryCounts,
  getRecommendedStops,
} from "@/lib/stops";

/*
  Revalidate rather than prerender once.

  The homepage reads the whole index, and the index changes every time an
  import runs. Baking it at build time meant the map kept showing whatever
  existed when the build happened — seven demo stops long after the database
  held hundreds. A minute of caching keeps it fast without going stale.
*/
export const revalidate = 60;

export default async function HomePage() {
  /*
    Counts rather than the index itself. getStopPins used to be called here and
    the result serialised into the page, which put every stop into the HTML.
    The map fetches them from /api/pins after paint instead.
  */
  const [recommended, categoryCounts, stopCount, stateCount] = await Promise.all([
    getRecommendedStops(3),
    getCategoryCounts(),
    countStops(),
    countStates(),
  ]);

  return (
    <>
      <Hero />

      <TripPlanner
        fallbackStops={recommended}
        stopCount={stopCount}
        stateCount={stateCount}
      />

      <HowItWorks />

      <ExploreCategories counts={categoryCounts} />
    </>
  );
}
