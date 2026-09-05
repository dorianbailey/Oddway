import type { Metadata } from "next";
import { StopCard } from "@/components/StopCard";
import { CATEGORIES } from "@/lib/categories";
import { getStops } from "@/lib/stops";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse the OddWay index by category: cryptids, folklore, haunted places, UFO history, weird history, museums and roadside oddities.",
};

export default async function ExplorePage() {
  const stops = await getStops();

  return (
    <>
      <section className="map-grid border-b border-contour/30">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h1 className="max-w-[20ch] text-hero">Explore the index</h1>
          <p className="mt-6 max-w-[62ch] text-lede text-ink-soft">
            Everything OddWay knows about, sorted by what it is. The index is
            small while we build it out, and it grows region by region.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {CATEGORIES.map((category) => {
          const matches = stops.filter(
            (stop) => stop.category === category.slug,
          );

          return (
            <section
              key={category.slug}
              id={category.slug}
              aria-labelledby={`${category.slug}-heading`}
              className="scroll-mt-28 border-t border-contour/40 py-10 first:border-t-0 first:pt-0"
            >
              <h2 id={`${category.slug}-heading`} className="text-section">
                {category.label}
              </h2>
              <p className="mt-3 max-w-[58ch] text-ink-soft">
                {category.blurb}
              </p>

              {matches.length > 0 ? (
                <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((stop) => (
                    <li key={stop.id} className="flex">
                      <StopCard stop={stop} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-8 border-l-2 border-contour pl-4 text-ink-soft">
                  Nothing indexed here yet. This category fills in as we cover
                  more of the map.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
