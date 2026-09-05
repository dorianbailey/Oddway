import { ExploreCategories } from "@/components/ExploreCategories";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { TripPlanner } from "@/components/TripPlanner";
import { getCategoryCounts, getFeaturedStops } from "@/lib/stops";

export default async function HomePage() {
  const [featuredStops, categoryCounts] = await Promise.all([
    getFeaturedStops(3),
    getCategoryCounts(),
  ]);

  return (
    <>
      <section className="map-grid border-b border-contour/30">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-4 sm:px-8 sm:pt-24">
          <Hero />
        </div>
      </section>

      <TripPlanner fallbackStops={featuredStops} />

      <HowItWorks />

      <ExploreCategories counts={categoryCounts} />
    </>
  );
}
