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
import { getSponsoredPlaces } from "@/lib/advertisers";

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
  const [recommended, categoryCounts, stopCount, stateCount, sponsored] =
    await Promise.all([
      getRecommendedStops(3),
      getCategoryCounts(),
      countStops(),
      countStates(),
      getSponsoredPlaces(),
    ]);

  /*
    Which paid placements go in the recommendations row today.

    At most three, because three is the row. Beyond that they rotate by day —
    the same arithmetic getRecommendedStops uses, so a sponsor appears on
    predictable days rather than at random, and a screenshot taken on Tuesday
    still means something on Wednesday.

    Chosen here rather than in the browser: a day index computed client-side
    disagrees with the server's often enough to produce a hydration mismatch,
    and the failure looks like the row flickering.
  */
  const day = Math.floor(Date.now() / 86_400_000);
  const withCoordinates = sponsored.filter(
    (ad) => ad.latitude !== null && ad.longitude !== null,
  );
  const sponsoredPlaces = (
    withCoordinates.length <= 3
      ? withCoordinates
      : Array.from({ length: 3 }, (_, i) =>
          withCoordinates[(day * 3 + i) % withCoordinates.length],
        )
  ).map((ad) => ({
    id: ad.id,
    businessName: ad.businessName,
    destinationUrl: ad.destinationUrl,
    description: ad.description,
    locationName: ad.locationName,
    latitude: ad.latitude as number,
    longitude: ad.longitude as number,
  }));

  return (
    <>
      <Hero />

      <TripPlanner
        fallbackStops={recommended}
        stopCount={stopCount}
        stateCount={stateCount}
        sponsoredPlaces={sponsoredPlaces}
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
