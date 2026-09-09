"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { PendingPhoto } from "@/lib/photos";

/**
 * The review queue.
 *
 * Approve, reject, or block the account. All three go through the same RLS
 * policies as everything else — an administrator is a person with a flag on
 * their profile, not a separate key with different powers, so a mistake here
 * cannot do more damage than the policies allow.
 */
export function ReviewQueue({ photos }: { photos: PendingPhoto[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, status: "approved" | "rejected") {
    setBusy(id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("stop_photos")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function block(authorId: string, name: string) {
    if (
      !window.confirm(
        `Block ${name}? Everything they have posted stops being shown, and ` +
          `they cannot upload again. Nothing is deleted and this can be undone.`,
      )
    ) {
      return;
    }
    setBusy(authorId);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("profiles")
        .update({ blocked: true })
        .eq("id", authorId);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  if (photos.length === 0) {
    return <p className="text-lede text-ink-soft">Nothing waiting.</p>;
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-6 border-l-2 border-[#8c2f22] pl-3">
          {error}
        </p>
      ) : null}

      <ul className="space-y-10">
        {photos.map((photo) => (
          <li
            key={photo.id}
            className="grid gap-6 border-b border-contour/40 pb-10 sm:grid-cols-[220px_1fr]"
          >
            <Image
              src={photo.url}
              alt={photo.altText ?? ""}
              width={440}
              height={440}
              unoptimized
              className="h-auto w-full border border-contour/45"
            />

            <div>
              <p className="font-display text-title font-bold">{photo.stopName}</p>
              <p className="text-[0.9rem] text-ink-soft">
                {photo.stopCity}, {photo.stopState} &middot; by {photo.photographer}
                {photo.rating !== null ? ` · rated ${photo.rating}/5` : ""}
              </p>

              {photo.caption ? <p className="mt-3">{photo.caption}</p> : null}
              {photo.altText ? (
                <p className="mt-2 text-[0.9rem] text-ink-soft">
                  Described as: {photo.altText}
                </p>
              ) : null}
              {!photo.altText ? (
                <p className="mt-2 text-[0.9rem] text-ink-soft">
                  No description given.
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => decide(photo.id, "approved")}
                  className="rounded-[3px] bg-route px-5 py-2 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => decide(photo.id, "rejected")}
                  className="rounded-[3px] border border-contour/60 px-5 py-2 font-semibold transition-colors hover:bg-lichen/30 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => block(photo.authorId, photo.photographer)}
                  className="rounded-[3px] px-5 py-2 text-[0.95rem] text-ink-soft underline underline-offset-4 hover:text-[#8c2f22] disabled:opacity-50"
                >
                  Block this account
                </button>
              </div>

              <p className="mt-4 text-[0.85rem] text-ink-soft">
                Approving this also frees {photo.photographer} to post without
                review from now on.
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
