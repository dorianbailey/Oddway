"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tripStore } from "@/lib/trip-store";
import type { Stop } from "@/types/oddway";

/**
 * Loads a curated trip into the planner.
 *
 * The trip store already drives the map, the ordering and the handoff to
 * Google Maps or Waze, so a ready-made route does not need its own machinery —
 * it just needs to put the right stops in the right place and send you to the
 * planner.
 *
 * It replaces rather than appends, and says so before doing it if there is
 * already a trip in progress. Quietly merging two trips together would produce
 * a route that is neither.
 */
export function LoadTripButton({ stops }: { stops: Stop[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function load() {
    tripStore.load(stops);
    router.push("/#plan");
  }

  function handleClick() {
    const existing = tripStore.getSnapshot();
    if (existing.length > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    load();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
      >
        {confirming ? "Replace my trip with this" : `Load these ${stops.length} stops`}
      </button>

      {confirming ? (
        <p role="status" className="mt-3 max-w-[46ch] text-[0.95rem] text-ink-soft">
          You already have stops saved. Loading this trip replaces them.{" "}
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="underline underline-offset-4 hover:text-ink"
          >
            Keep what I have
          </button>
        </p>
      ) : null}
    </div>
  );
}
