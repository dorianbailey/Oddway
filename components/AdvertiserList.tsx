"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { AdvertiserRow } from "@/lib/advertisers-admin";

/**
 * Advertisers, and what to do about them.
 *
 * Same shape as the photo queue: the administrator's own session, the same row
 * level security, and router.refresh() afterwards rather than local state that
 * can drift from the database.
 *
 * The important thing this screen does is show you what you are approving. A
 * button that sets a status without displaying the banner, the link and where
 * it goes would be the SQL with extra steps — and the thing being published is
 * a stranger's image and a stranger's URL on your pages.
 */

const STATUS_NOTE: Record<AdvertiserRow["status"], string> = {
  pending: "Not shown. Waiting on you.",
  active: "Live on the site.",
  paused: "Not shown. Their details are kept.",
  cancelled: "Subscription ended. Their details are kept.",
};

export function AdvertiserList({ advertisers }: { advertisers: AdvertiserRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: AdvertiserRow["status"]) {
    setBusy(id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("advertisers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(advertiser: AdvertiserRow) {
    if (
      !window.confirm(
        `Delete ${advertiser.businessName} entirely? This cannot be undone. ` +
          `To take an advertisement down without losing their details, pause it instead.`,
      )
    ) {
      return;
    }

    setBusy(advertiser.id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();

      /*
        The image first, then the row. The other order leaves a file in the
        bucket that nothing points at and nobody will ever find again.
      */
      if (advertiser.bannerPath) {
        await supabase.storage.from("ad-banners").remove([advertiser.bannerPath]);
      }

      const { error } = await supabase
        .from("advertisers")
        .delete()
        .eq("id", advertiser.id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  if (advertisers.length === 0) {
    return <p className="text-lede text-ink-soft">Nobody is advertising yet.</p>;
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-6 border-l-2 border-[#8c2f22] pl-3">
          {error}
        </p>
      ) : null}

      <ul className="space-y-10">
        {advertisers.map((ad) => (
          <li key={ad.id} className="border-b border-contour/40 pb-10">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="font-display text-title font-bold">
                {ad.businessName}
              </p>
              <p className="text-[0.9rem] text-ink-soft">
                {ad.plan === "banner" ? "Banner, $59" : "Map placement, $79"}
                {" · "}
                <span className="font-semibold text-ink">{ad.status}</span>
              </p>
            </div>

            <p className="mt-1 text-[0.9rem] text-ink-soft">
              {STATUS_NOTE[ad.status]}
              {ad.paidThrough
                ? ` Paid through ${new Date(ad.paidThrough).toLocaleDateString()}.`
                : ad.hasSubscription
                  ? ""
                  : " No Stripe subscription — invoiced by hand."}
            </p>

            {/*
              Still holding a setup link means they paid and never filled the
              form in. Worth seeing, because the usual answer is to email them
              rather than to approve anything.
            */}
            {ad.awaitingSetup ? (
              <p className="mt-3 border-l-2 border-contour pl-4 text-[0.95rem] text-ink-soft">
                Paid, but has not filled in the form yet. Their setup link is
                still unused and expires seven days after they paid.
              </p>
            ) : null}

            {ad.bannerUrl ? (
              <a
                href={ad.destinationUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block max-w-[560px] overflow-hidden rounded-[3px] border border-contour/45"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.bannerUrl}
                  alt={`${ad.businessName} banner`}
                  className="block h-auto w-full"
                />
              </a>
            ) : ad.submitted ? (
              <p className="mt-5 text-[0.95rem] text-ink-soft">
                No banner uploaded.
              </p>
            ) : null}

            <dl className="mt-5 grid gap-x-8 gap-y-3 text-[0.95rem] sm:grid-cols-2">
              <div>
                <dt className="text-ink-soft">Links to</dt>
                {/*
                  normal-case, because globals.css title-cases every dd on the
                  site and a web address is not a title. "Https://Taketheoddway.Com/"
                  still works as a link and still reads as a mistake.
                */}
                <dd className="mt-0.5 break-all normal-case">
                  {ad.destinationUrl ? (
                    <a
                      href={ad.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-route underline underline-offset-4"
                    >
                      {ad.destinationUrl}
                    </a>
                  ) : (
                    <span className="text-ink-soft">Not given</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">Contact</dt>
                <dd className="mt-0.5 break-all normal-case">
                  <a
                    href={`mailto:${ad.contactEmail}`}
                    className="underline underline-offset-4"
                  >
                    {ad.contactEmail}
                  </a>
                  {ad.contactName ? ` (${ad.contactName})` : ""}
                </dd>
              </div>
              {ad.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-ink-soft">Description</dt>
                  <dd className="mt-0.5 normal-case">{ad.description}</dd>
                </div>
              ) : null}
              {ad.plan === "map" ? (
                <div className="sm:col-span-2">
                  <dt className="text-ink-soft">On the map</dt>
                  <dd className="mt-0.5 normal-case">
                    {ad.locationName ?? "No name given"}
                    {ad.address ? ` — ${ad.address}` : ""}
                    {ad.latitude !== null && ad.longitude !== null
                      ? ` (${ad.latitude}, ${ad.longitude})`
                      : " — no coordinates, so nothing can be plotted yet"}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {ad.status !== "active" ? (
                <button
                  type="button"
                  disabled={busy !== null || !ad.submitted}
                  onClick={() => setStatus(ad.id, "active")}
                  className="rounded-[3px] bg-route px-5 py-2 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-50"
                >
                  {ad.status === "pending" ? "Approve and publish" : "Put back up"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setStatus(ad.id, "paused")}
                  className="rounded-[3px] border border-contour/60 px-5 py-2 font-semibold transition-colors hover:bg-lichen/30 disabled:opacity-50"
                >
                  Take it down
                </button>
              )}

              <button
                type="button"
                disabled={busy !== null}
                onClick={() => remove(ad)}
                className="rounded-[3px] px-5 py-2 text-[0.95rem] text-ink-soft underline underline-offset-4 hover:text-[#8c2f22] disabled:opacity-50"
              >
                Delete entirely
              </button>
            </div>

            {!ad.submitted ? (
              <p className="mt-3 text-[0.85rem] text-ink-soft">
                Nothing to publish until they have sent their details in.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
