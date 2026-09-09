import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ReviewQueue } from "@/components/ReviewQueue";
import { getHiddenPhotos, getPendingPhotos } from "@/lib/photos";
import { HiddenPhotos } from "@/components/HiddenPhotos";
import { getCurrentProfile } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review",
  robots: { index: false, follow: false },
};

export default async function ReviewPage() {
  const profile = await getCurrentProfile();

  /*
    Not found rather than a permission message. Telling somebody a page exists
    but is not for them is an invitation; this way the route is simply absent
    unless it is yours.
  */
  if (!profile?.is_admin) notFound();

  const photos = await getPendingPhotos();
  const hidden = await getHiddenPhotos();

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">Review</h1>
        <p className="mt-6 max-w-[56ch] text-lede text-[#cfc9bb]">
          {photos.length === 0
            ? "Nothing waiting."
            : `${photos.length} photo${photos.length === 1 ? "" : "s"} waiting. Only first-time posters appear here.`}
        </p>
      </PageHero>
      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-16">
        <ReviewQueue photos={photos} />

        {/*
          Hidden photographs, below the queue. They are not waiting for a
          decision — a decision was made — but a reversible action needs
          somewhere to reverse it from.
        */}
        <section className="mt-16 border-t border-contour/40 pt-10">
          <h2 className="text-section">Hidden</h2>
          <p className="mt-3 mb-8 max-w-[52ch] text-ink-soft">
            Taken off the site but not deleted. The files are still here, so
            anything here can go back up.
          </p>
          <HiddenPhotos photos={hidden} />
        </section>
      </div>
    </>
  );
}
