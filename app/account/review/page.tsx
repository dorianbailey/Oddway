import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ReviewQueue } from "@/components/ReviewQueue";
import { getAccounts, getHiddenPhotos, getPendingPhotos, getSuggestions } from "@/lib/photos";
import { AccountList } from "@/components/AccountList";
import { SuggestionList } from "@/components/SuggestionList";
import { HiddenPhotos } from "@/components/HiddenPhotos";
import { getCurrentProfile } from "@/lib/supabase-server";
import { AdvertiserList } from "@/components/AdvertiserList";
import { getAdvertisers } from "@/lib/advertisers-admin";

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
  const accounts = await getAccounts();
  const suggestions = await getSuggestions();
  const advertisers = await getAdvertisers();

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
          Advertisers directly under the photo queue, because both are the same
          job: somebody has sent something in and it is not on the site until
          you have looked at it. Paying does not skip the queue.
        */}
        <section className="mt-16 border-t border-contour/40 pt-10">
          <h2 className="text-section">Advertising</h2>
          {/*
            "No waiting to be looked at" was what the count produced at zero,
            which reads as a different sentence entirely. Worth the extra
            variable to say it properly.
          */}
          <p className="mt-3 mb-8 max-w-[56ch] text-ink-soft">
            {(() => {
              const waiting = advertisers.filter(
                (a) => a.status === "pending" && a.submitted,
              ).length;
              return waiting === 0
                ? "Nothing waiting."
                : `${waiting} waiting to be looked at.`;
            })()}{" "}
            Approving puts a banner on the site within a minute; taking one down
            keeps their details so it can go back up.
          </p>
          <AdvertiserList advertisers={advertisers} />
        </section>

        {/*
          Hidden photographs, below the queue. They are not waiting for a
          decision — a decision was made — but a reversible action needs
          somewhere to reverse it from.
        */}
        <section className="mt-16 border-t border-contour/40 pt-10">
          <h2 className="text-section">Suggestions</h2>
          <p className="mt-3 mb-8 max-w-[56ch] text-ink-soft">
            What people have written in about &mdash; new places, corrections,
            somewhere that has closed. Marking one handled keeps it as a record
            rather than removing it.
          </p>
          <SuggestionList suggestions={suggestions} />
        </section>

        <section className="mt-16 border-t border-contour/40 pt-10">
          <h2 className="text-section">Hidden</h2>
          <p className="mt-3 mb-8 max-w-[52ch] text-ink-soft">
            Taken off the site but not deleted. The files are still here, so
            anything here can go back up.
          </p>
          <HiddenPhotos photos={hidden} />
        </section>

        <section className="mt-16 border-t border-contour/40 pt-10">
          <h2 className="text-section">All User Profiles</h2>
          <p className="mt-3 mb-8 max-w-[56ch] text-ink-soft">
            {accounts.length} account{accounts.length === 1 ? "" : "s"}. Blocking
            hides everything an account has posted and stops it uploading again;
            nothing is deleted and it can be undone.
          </p>
          <AccountList accounts={accounts} />
        </section>
      </div>
    </>
  );
}
