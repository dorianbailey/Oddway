"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { bucketStore } from "@/lib/bucket-store";
import type { Stop } from "@/types/oddway";

interface BucketListProps {
  /** The list as the server read it. */
  stops: Stop[];
}

/**
 * The saved list, with a way to unsave.
 *
 * The rows are server-rendered and then filtered against the store, so a
 * removal disappears immediately rather than after a round trip. The map above
 * is server-rendered and cannot do that, so a refresh is asked for in the
 * background — the row goes at once, the pin follows a moment later. Waiting
 * for the refresh before removing the row would make every tap feel broken.
 *
 * Before the store has finished loading it shows everything the server sent.
 * Filtering against an empty set would blank the whole list for the moment
 * between hydration and the first query coming back, which reads as the
 * bucket list having been lost.
 */
export function BucketList({ stops }: BucketListProps) {
  const router = useRouter();
  const ids = useSyncExternalStore(
    bucketStore.subscribe,
    bucketStore.getSnapshot,
    bucketStore.getServerSnapshot,
  );
  const [failed, setFailed] = useState<string | null>(null);

  // Not reactive on its own, but every change to the store emits, so the
  // render that follows the load reads the settled value.
  const ready = bucketStore.isReady();
  const visible = ready ? stops.filter((stop) => ids.has(stop.id)) : stops;

  if (visible.length === 0) return null;

  return (
    <>
      <h2 className="text-section">
        {visible.length} {visible.length === 1 ? "place" : "places"} saved
      </h2>

      <ul className="mt-8 divide-y divide-contour/30 border-y border-contour/30">
        {visible.map((stop) => (
          <li
            key={stop.id}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4"
          >
            <Link
              href={`/stops/${stop.slug}`}
              className="font-display font-bold underline-offset-4 hover:text-route hover:underline"
            >
              {stop.name}
            </Link>
            <span className="text-[0.9rem] text-ink-soft">
              {stop.city}, {stop.state}
            </span>

            <button
              type="button"
              onClick={async () => {
                setFailed(null);
                const ok = await bucketStore.toggle(stop.id);
                if (ok) router.refresh();
                else setFailed(stop.id);
              }}
              className="ml-auto rounded-[2px] text-[0.9rem] text-route underline underline-offset-4 transition-colors hover:text-ink"
            >
              Remove
              <span className="sr-only">
                {" "}
                {stop.name} from your bucket list
              </span>
            </button>

            {failed === stop.id ? (
              <p role="status" className="w-full text-[0.85rem] text-route">
                That didn&rsquo;t save. Check your connection and try again.
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[0.9rem] text-ink-soft">
        You can also remove one from its own page, or from any card in the
        index.
      </p>
    </>
  );
}
