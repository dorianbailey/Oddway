"use client";

import Link from "next/link";
import { tripStore } from "@/lib/trip-store";
import { useTrip } from "./TripSummary";
import { OpenNowBadge } from "./OpenNowBadge";
import { categoryLabel } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { formatAccess, formatCoordinates, formatDetour } from "@/lib/format";
import { formatOffRoute } from "@/lib/units";
import { useUnits } from "./UnitsProvider";
import type { Stop } from "@/types/oddway";

/** Small enough to read as handled rather than broken. */
const TILTS = [
  "rotate-[-0.5deg]",
  "rotate-[0.35deg]",
  "rotate-[-0.25deg]",
  "rotate-[0.55deg]",
] as const;

interface StopCardProps {
  /**
   * A stop, optionally carrying the corridor query's measurement of how far it
   * sits from the current route. That field only exists after a search.
   */
  stop: Stop & { distanceFromRouteKm?: number };
}

/**
 * One result, styled as a clipping: cut out, taped down, sitting at a slight
 * angle on the sheet.
 *
 * The angle is derived from the stop's id rather than randomised, so a card
 * does not shift when the list re-renders and the server and client agree on
 * hydration. Four values is enough to look hand-placed without any card
 * tilting far enough to be annoying.
 *
 * The trip state is local for now. When trips become real, replace `added`
 * with a value from the trip store and call the store from `toggle`.
 */
export function StopCard({ stop }: StopCardProps) {
  // Shared store, so the card and the trip panel can never disagree.
  // Stable per stop, so it never changes between renders.
  const tiltIndex = stop.id
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0) % TILTS.length;

  const trip = useTrip();
  const added = trip.some((item) => item.id === stop.id);
  const { units } = useUnits();

  return (
    <article
      className={cx(
        "clipping hover:clipping-hover flex w-full flex-col rounded-[2px] border border-contour/40 bg-paper-raised",
        TILTS[tiltIndex],
      )}
    >
      <span aria-hidden="true" className="tape" />

      {/*
        The image band. `stop.image` is null across the demo data, so it falls
        back to grid paper with the coordinates printed on it. Drop an
        <Image /> in here once we have licensed photography.
      */}
      <div className="flex items-end justify-between gap-3 rounded-t-[2px] border-b border-contour/35 bg-paper px-5 py-3">
        <span className="rounded-full bg-lichen px-3 py-1 text-[0.8rem] font-semibold text-ink">
          {categoryLabel(stop.category)}
        </span>
        <span className="font-display text-[0.8rem] text-ink-soft italic">
          {formatCoordinates(stop.latitude, stop.longitude)}
        </span>
      </div>

      <div className="flex grow flex-col p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h3 className="text-title">
            <Link
              href={`/stops/${stop.slug}`}
              className="underline-offset-4 hover:text-route hover:underline"
            >
              {stop.name}
            </Link>
          </h3>
          <OpenNowBadge
            openingHours={stop.openingHours}
            timezone={stop.timezone}
            compact
          />
        </div>
        <p className="mt-1 text-[0.95rem] text-ink-soft">
          {stop.city}, {stop.state}
        </p>

        <p className="mt-4 text-[0.98rem] text-ink">{stop.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-contour/35 pt-4 text-[0.9rem]">
          {/*
            Detour is computed per route in lib/corridor.ts, never stored.
            Outside a search it is 0, and "0 min off route" would claim the
            stop sits directly on your way — so show nothing instead.
          */}
          {stop.detourMinutes > 0 ? (
            <div>
              <dt className="text-ink-soft">Detour</dt>
              <dd className="mt-0.5 font-semibold">
                {formatDetour(stop.detourMinutes)}
              </dd>
              {stop.distanceFromRouteKm !== undefined ? (
                <dd className="mt-0.5 text-[0.85rem] font-normal text-ink-soft">
                  {formatOffRoute(stop.distanceFromRouteKm, units)}
                </dd>
              ) : null}
            </div>
          ) : null}
          <div>
            <dt className="text-ink-soft">Access</dt>
            <dd className="mt-0.5 font-semibold">
              {formatAccess(stop.publicAccess)}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => tripStore.toggle(stop)}
          className={cx(
            "mt-5 w-full rounded-[3px] border px-4 py-2.5 font-semibold transition-colors",
            added
              ? "border-pine bg-pine text-paper hover:bg-pine-deep"
              : "border-pine bg-transparent text-pine hover:bg-lichen/50",
          )}
        >
          {added ? "Remove from trip" : "Add to trip"}
          <span className="sr-only"> — {stop.name}</span>
        </button>
      </div>
    </article>
  );
}
