import { ExploreCategories } from "@/components/ExploreCategories";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { BannerAd } from "@/components/BannerAd";
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

      {/*
        After the results and before the explainer.

        Not between the stop cards. That list is somebody deciding whether to
        drive two hours out of their way, and an advert spliced into it
        competes with the one thing the page exists to do. Here it sits in the
        gap where attention is already changing, and it disappears entirely
        when nothing is booked.
      */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <BannerAd />
      </div>

      <HowItWorks />

      <ExploreCategories counts={categoryCounts} />
    </>
  );
}
