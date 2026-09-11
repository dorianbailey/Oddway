"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { bucketStore } from "@/lib/bucket-store";
import { cx } from "@/lib/cx";
import type { Stop } from "@/types/oddway";

interface AddToBucketListButtonProps {
  stop: Stop;
  className?: string;
}

/**
 * Put a stop on the bucket list, or take it off.
 *
 * Signed out this is a link to the account page rather than a button that
 * fails. A control that looks live and does nothing is the worst of the three
 * options; saying what it needs is the least annoying.
 *
 * Until the store has finished asking who is signed in it renders as the
 * signed-out link — briefly wrong for someone who is signed in, but the
 * alternative is a disabled control or a spinner in every card on the page,
 * and the flicker lasts one round trip.
 */
export function AddToBucketListButton({
  stop,
  className,
}: AddToBucketListButtonProps) {
  const ids = useSyncExternalStore(
    bucketStore.subscribe,
    bucketStore.getSnapshot,
    bucketStore.getServerSnapshot,
  );
  const userId = useSyncExternalStore(
    bucketStore.subscribe,
    bucketStore.getUserId,
    bucketStore.getUserIdServerSnapshot,
  );

  const [failed, setFailed] = useState(false);
  const saved = ids.has(stop.id);

  if (!userId) {
    return (
      <Link
        href="/account"
        className={cx(
          "block w-full rounded-[3px] border border-contour/50 px-4 py-2.5 text-center font-semibold text-ink-soft transition-colors hover:border-contour hover:bg-lichen/40",
          className,
        )}
      >
        Sign in to save this
        <span className="sr-only"> — {stop.name} to your bucket list</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          setFailed(false);
          const ok = await bucketStore.toggle(stop.id);
          if (!ok) setFailed(true);
        }}
        aria-pressed={saved}
        className={cx(
          "w-full rounded-[3px] border px-4 py-2.5 font-semibold transition-colors",
          saved
            ? "border-brass bg-brass/20 text-ink hover:bg-brass/30"
            : "border-contour/50 bg-transparent text-ink-soft hover:border-contour hover:bg-lichen/40",
          className,
        )}
      >
        {saved ? "On your bucket list" : "Add to bucket list"}
        <span className="sr-only"> — {stop.name}</span>
      </button>

      {failed ? (
        <p role="status" className="mt-2 text-[0.85rem] text-route">
          That didn&rsquo;t save. Check your connection and try again.
        </p>
      ) : null}
    </>
  );
}
