"use client";

import { useState } from "react";
import { categoryLabel } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { formatAccess, formatCoordinates, formatDetour } from "@/lib/format";
import { formatOffRoute } from "@/lib/units";
import { useUnits } from "./UnitsProvider";
import type { Stop } from "@/types/oddway";

interface StopCardProps {
  /**
   * A stop, optionally carrying the corridor query's measurement of how far it
   * sits from the current route. That field only exists after a search.
   */
  stop: Stop & { distanceFromRouteKm?: number };
}

/**
 * One result. Styled after a field-guide specimen card: hairline rule, a
 * grid-printed header band, and the practical facts a driver needs before
 * deciding to leave the highway.
 *
 * The trip state is local for now. When trips become real, replace `added`
 * with a value from the trip store and call the store from `toggle`.
 */
export function StopCard({ stop }: StopCardProps) {
  const [added, setAdded] = useState(false);
  const { units } = useUnits();

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-[4px] border border-contour/45 bg-paper-raised">
      {/*
        The image band. `stop.image` is null across the demo data, so it falls
        back to grid paper with the coordinates printed on it. Drop an
        <Image /> in here once we have licensed photography.
      */}
      <div className="map-grid flex items-end justify-between gap-3 border-b border-contour/35 bg-paper px-5 py-3">
        <span className="rounded-full bg-lichen px-3 py-1 text-[0.8rem] font-semibold text-ink">
          {categoryLabel(stop.category)}
        </span>
        <span className="font-display text-[0.8rem] text-ink-soft italic">
          {formatCoordinates(stop.latitude, stop.longitude)}
        </span>
      </div>

      <div className="flex grow flex-col p-5">
        <h3 className="text-title">{stop.name}</h3>
        <p className="mt-1 text-[0.95rem] text-ink-soft">
          {stop.city}, {stop.state}
        </p>

        <p className="mt-4 text-[0.98rem] text-ink">{stop.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-contour/35 pt-4 text-[0.9rem]">
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
          <div>
            <dt className="text-ink-soft">Access</dt>
            <dd className="mt-0.5 font-semibold">
              {formatAccess(stop.publicAccess)}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => setAdded((current) => !current)}
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
