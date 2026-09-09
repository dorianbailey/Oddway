"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { PendingPhoto } from "@/lib/photos";

/**
 * Photographs that were hidden, with a way to put them back.
 *
 * The hide button existed before this page did, which meant hiding something
 * removed it from the site and from view entirely — reversible in principle
 * and unrecoverable in practice unless you opened the database by hand.
 */
export function HiddenPhotos({ photos }: { photos: PendingPhoto[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function restore(id: string) {
    setBusy(id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("stop_photos")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not restore it.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, storagePath: string, photographer: string) {
    if (
      !window.confirm(
        `Delete this photo by ${photographer} for good? The file goes too and ` +
          `this cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error: rowError } = await supabase
        .from("stop_photos")
        .delete()
        .eq("id", id);
      if (rowError) throw new Error(rowError.message);
      await supabase.storage.from("stop-photos").remove([storagePath]);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete it.");
    } finally {
      setBusy(null);
    }
  }

  if (photos.length === 0) {
    return <p className="text-ink-soft">Nothing hidden.</p>;
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-6 border-l-2 border-[#8c2f22] pl-3">
          {error}
        </p>
      ) : null}

      <ul className="space-y-8">
        {photos.map((photo) => (
          <li
            key={photo.id}
            className="grid gap-5 border-b border-contour/30 pb-8 sm:grid-cols-[140px_1fr]"
          >
            <Image
              src={photo.url}
              alt={photo.altText ?? ""}
              width={280}
              height={280}
              unoptimized
              className="h-auto w-full border border-contour/45 opacity-70"
            />
            <div>
              <p className="font-semibold">{photo.stopName}</p>
              <p className="text-[0.9rem] text-ink-soft">
                {photo.stopCity}, {photo.stopState} &middot; by {photo.photographer}
              </p>
              {photo.caption ? (
                <p className="mt-2 text-[0.95rem]">{photo.caption}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-4">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => restore(photo.id)}
                  className="rounded-[3px] border border-contour/60 px-4 py-1.5 text-[0.9rem] font-semibold transition-colors hover:bg-lichen/30 disabled:opacity-50"
                >
                  Put it back
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => remove(photo.id, photo.storagePath, photo.photographer)}
                  className="text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-[#8c2f22] disabled:opacity-50"
                >
                  Delete for good
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
