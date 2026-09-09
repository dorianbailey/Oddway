"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

interface PhotoAdminControlsProps {
  photoId: string;
  storagePath: string;
  photographer: string;
}

/**
 * Moderation controls on a photograph, wherever it appears.
 *
 * Two actions rather than one, because they are not the same decision.
 *
 * Hiding sets the status to rejected. The row and the file both survive, so it
 * can be undone from the dashboard — the right tool for "this does not belong
 * on this stop" or "I want to look at this again later".
 *
 * Deleting removes the row and the stored file. It cannot be undone, and it is
 * what you want for something that should not exist on the site at all.
 *
 * Only rendered when the viewer is an administrator, and the policies behind
 * both actions check that independently — so a component rendered by mistake
 * still cannot do anything.
 */
export function PhotoAdminControls({
  photoId,
  storagePath,
  photographer,
}: PhotoAdminControlsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function hide() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("stop_photos")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", photoId);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not hide it.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete this photo by ${photographer} permanently? The image file goes ` +
          `too and this cannot be undone. Use Hide instead if you might change ` +
          `your mind.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();

      /*
        The row goes first. If the file were deleted first and the row delete
        then failed, the page would keep listing a photograph whose image is
        gone — a broken picture is worse than an orphaned file, and an orphaned
        file is invisible to everybody.
      */
      const { error: rowError } = await supabase
        .from("stop_photos")
        .delete()
        .eq("id", photoId);
      if (rowError) throw new Error(rowError.message);

      const { error: fileError } = await supabase.storage
        .from("stop-photos")
        .remove([storagePath]);
      if (fileError) {
        // The photograph is already gone from the site. Say so rather than
        // implying nothing happened.
        setError(
          "Removed from the site, but the stored file could not be deleted. " +
            "Clear it from Storage in the dashboard.",
        );
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
      <button
        type="button"
        onClick={hide}
        disabled={busy}
        className="text-[0.85rem] text-ink-soft underline underline-offset-4 hover:text-ink disabled:opacity-50"
      >
        Hide
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="text-[0.85rem] text-ink-soft underline underline-offset-4 hover:text-[#8c2f22] disabled:opacity-50"
      >
        Delete
      </button>
      {error ? (
        <span role="alert" className="block text-[0.85rem] text-[#8c2f22]">
          {error}
        </span>
      ) : null}
    </span>
  );
}
