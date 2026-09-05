"use client";

import { useSyncExternalStore } from "react";
import { tripStore } from "@/lib/trip-store";
import { categoryLabel } from "@/lib/categories";
import { formatDetour, formatDuration } from "@/lib/format";
import type { Route } from "@/types/oddway";

interface TripSummaryProps {
  /** The planned route, when there is one. Used for the total journey time. */
  route?: Route | null;
}

/** Read the trip. Exported so StopCard can share the same source of truth. */
export function useTrip() {
  return useSyncExternalStore(
    tripStore.subscribe,
    tripStore.getSnapshot,
    tripStore.getServerSnapshot,
  );
}

/**
 * What the traveller has actually chosen.
 *
 * Renders nothing until something is added — an empty panel on every visit
 * would be noise. Stops appear in the order the corridor query returned them,
 * which is the order they occur along the route, not the order they were
 * clicked.
 */
export function TripSummary({ route = null }: TripSummaryProps) {
  const stops = useTrip();

  if (stops.length === 0) return null;

  const detourMinutes = stops.reduce(
    (total, stop) => total + stop.detourMinutes,
    0,
  );

  const totalSeconds = route
    ? route.durationSeconds + detourMinutes * 60
    : null;

  return (
    <section
      aria-labelledby="trip-heading"
      className="rounded-[4px] border border-contour/45 bg-paper-raised p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="trip-heading" className="text-title">
          Your trip
        </h2>
        <button
          type="button"
          onClick={() => tripStore.clear()}
          className="rounded-[2px] text-[0.95rem] text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
        >
          Clear all
        </button>
      </div>

      <ol className="mt-5 divide-y divide-contour/30 border-y border-contour/30">
        {stops.map((stop, index) => (
          <li
            key={stop.id}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
          >
            <span
              aria-hidden="true"
              className="font-display font-bold text-route"
            >
              {index + 1}
            </span>
            <span className="font-display font-bold">{stop.name}</span>
            <span className="text-[0.9rem] text-ink-soft">
              {categoryLabel(stop.category)} in {stop.city}, {stop.state}
            </span>
            <span className="ml-auto flex items-baseline gap-4">
              <span className="text-[0.9rem] text-ink-soft">
                {formatDetour(stop.detourMinutes)}
              </span>
              <button
                type="button"
                onClick={() => tripStore.remove(stop.id)}
                className="rounded-[2px] text-[0.9rem] text-route underline underline-offset-4"
              >
                Remove
                <span className="sr-only"> {stop.name} from your trip</span>
              </button>
            </span>
          </li>
        ))}
      </ol>

      <p role="status" className="mt-5 text-ink-soft">
        {stops.length === 1 ? "1 stop" : `${stops.length} stops`}, adding{" "}
        <span className="font-semibold text-ink">
          {formatDuration(detourMinutes * 60)}
        </span>{" "}
        to your drive.
        {totalSeconds !== null ? (
          <>
            {" "}
            Around{" "}
            <span className="font-semibold text-ink">
              {formatDuration(totalSeconds)}
            </span>{" "}
            door to door, before you stop to look at anything.
          </>
        ) : null}
      </p>
    </section>
  );
}
