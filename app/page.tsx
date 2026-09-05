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
      <section className="map-grid border-b border-contour/30">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-4 sm:px-8 sm:pt-24">
          <Hero />
        </div>
      </section>

      <TripPlanner fallbackStops={recommended} allStops={allStops} />

      <HowItWorks />

      <ExploreCategories counts={categoryCounts} />
    </>
  );
}
