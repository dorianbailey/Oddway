import type { Metadata } from "next";
import { SuggestionForm } from "@/components/SuggestionForm";
import { getStopBySlug } from "@/lib/stops";
import { getCategory } from "@/lib/categories";
import type { CategorySlug } from "@/types/oddway";

interface SuggestPageProps {
  searchParams: Promise<{ stop?: string; category?: string }>;
}

export const metadata: Metadata = {
  title: "Suggest something",
  description:
    "Tell us about a place we've missed, an event worth listing, or something in the index that's wrong.",
};

export default async function SuggestPage({ searchParams }: SuggestPageProps) {
  const { stop: slug, category: categoryParam } = await searchParams;
  // Look both up rather than trusting the URL, so the page cannot be made to
  // display arbitrary text by editing the query string.
  const stop = slug ? await getStopBySlug(slug) : null;
  const category = categoryParam
    ? getCategory(categoryParam as CategorySlug)
    : undefined;

  return (
    <>
      <section className="map-grid border-b border-contour/30">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h1 className="max-w-[18ch] text-hero">
            {stop
              ? `Something wrong with ${stop.name}?`
              : category
                ? `Know a ${category.label.toLowerCase().replace(/s$/, "")} stop we've missed?`
                : "Tell us what we've got wrong"}
          </h1>
          <p className="mt-6 max-w-[62ch] text-lede text-ink-soft">
            Most of this index was assembled from public map data and then
            researched by hand. Plenty of it is still unverified, and places
            close, move and change their hours without telling anybody.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.3fr_1fr]">
        <SuggestionForm
          defaultKind={stop ? "correction" : category ? "new_place" : "other"}
          stopSlug={stop?.slug}
          stopName={stop?.name}
          category={category?.slug}
          categoryLabel={category?.label}
        />

        <aside className="text-ink-soft">
          <h2 className="text-title text-ink">What&rsquo;s most useful</h2>
          <ul className="mt-4 space-y-3">
            <li className="border-l-2 border-contour pl-4">
              <span className="font-semibold text-ink">Corrections.</span> A
              place that has closed, moved, or whose hours are wrong. This is
              the single most valuable thing you can send — it stops somebody
              else wasting a drive.
            </li>
            <li className="border-l-2 border-contour pl-4">
              <span className="font-semibold text-ink">Places we&rsquo;ve missed.</span>{" "}
              Especially ones that aren&rsquo;t on any map yet. A rough location
              and what it is will do.
            </li>
            <li className="border-l-2 border-contour pl-4">
              <span className="font-semibold text-ink">Events.</span> Festivals
              and gatherings, with dates if you have them and the organiser&rsquo;s
              page if there is one.
            </li>
          </ul>

          <p className="mt-6 text-[0.9rem]">
            Everything is read by a person. There is no ticket number and no
            automatic reply.
          </p>
        </aside>
      </div>
    </>
  );
}
