"use client";

import { tripStore } from "@/lib/trip-store";
import { cx } from "@/lib/cx";
import { useTrip } from "./TripSummary";
import type { Stop } from "@/types/oddway";

interface AddToTripButtonProps {
  stop: Stop;
  className?: string;
}

/**
 * The same trip toggle StopCard uses, extracted so the detail page can share
 * it without dragging the whole card along.
 */
export function AddToTripButton({ stop, className }: AddToTripButtonProps) {
  const trip = useTrip();
  const added = trip.some((item) => item.id === stop.id);

  return (
    <button
      type="button"
      onClick={() => tripStore.toggle(stop)}
      className={cx(
        "w-full rounded-[3px] border px-4 py-2.5 font-semibold transition-colors",
        added
          ? "border-pine bg-pine text-paper hover:bg-pine-deep"
          : "border-pine bg-transparent text-pine hover:bg-lichen/50",
        className,
      )}
    >
      {added ? "Remove from trip" : "Add to trip"}
      <span className="sr-only"> — {stop.name}</span>
    </button>
  );
}
