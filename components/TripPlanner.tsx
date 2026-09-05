"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryFilters } from "./CategoryFilters";
import { MapSection } from "./MapSection";
import { RouteSearch } from "./RouteSearch";
import { StopCard } from "./StopCard";
import { formatDuration } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import { useUnits } from "./UnitsProvider";
import type { CategorySlug, Route, Stop } from "@/types/oddway";

interface TripPlannerProps {
  /** Shown before any search runs, so the page is never empty. */
  fallbackStops: Stop[];
}

interface TripResult {
  query: { origin: string; destination: string };
  route: Route;
  stops: Stop[];
  attribution: string;
}

type Status = "idle" | "loading" | "done" | "error";

interface PlannedRoute {
  origin: string;
  destination: string;
}

/** Sensible ceiling on how far off-route someone will realistically go. */
const DETOUR_MIN = 5;
const DETOUR_MAX = 120;
const DETOUR_STEP = 5;
const DEFAULT_DETOUR = 30;

/**
 * Wait after a filter or slider change before re-querying. Long enough that
 * dragging the slider across its range costs one request, not twenty — which
 * matters against a 2,500/day provider quota.
 */
const REFINE_DEBOUNCE_MS = 500;

/**
 * Owns the trip. Everything that changes when you plan a route lives here:
 * the search fields, the category filters, the map and the results list.
 *
 * The heavy lifting happens server-side in /api/trip — this component never
 * sees an API key and never talks to a provider directly.
 */
export function TripPlanner({ fallbackStops }: TripPlannerProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategorySlug[]>([]);
  const [maxDetourMinutes, setMaxDetourMinutes] = useState(DEFAULT_DETOUR);
  const [planned, setPlanned] = useState<PlannedRoute | null>(null);
  const { units } = useUnits();

  // Cancel a search still in flight when a new one starts.
  const inFlight = useRef<AbortController | null>(null);

  /**
   * Submitting the form only records what was asked for. The effect below is
   * the single place that actually fetches, so a new search and a refinement
   * take exactly the same path and can never fire two overlapping requests.
   */
  const handlePlan = useCallback((origin: string, destination: string) => {
    setPlanned({ origin, destination });
  }, []);

  useEffect(() => {
    if (!planned) return;

    const timer = setTimeout(async () => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setStatus("loading");
      setError(null);

      try {
        const response = await fetch("/api/trip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: planned.origin,
            destination: planned.destination,
            categories,
            maxDetourMinutes,
          }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "That search didn't work. Try again.");
          setStatus("error");
          return;
        }

        setResult(data as TripResult);
        setStatus("done");
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError("Couldn't reach the server. Check your connection and try again.");
        setStatus("error");
      }
    }, REFINE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [planned, categories, maxDetourMinutes]);

  const shownStops = result ? result.stops : fallbackStops;
  const hasSearched = status === "done" && result !== null;

  return (
    <>
      <section className="map-grid border-b border-contour/30">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <RouteSearch
            onPlan={handlePlan}
            isLoading={status === "loading"}
            serverError={error}
          />
          <CategoryFilters className="mt-12" onChange={setCategories} />

          <div className="mt-10 max-w-md">
            <label
              htmlFor="detour-limit"
              className="block text-title font-display font-bold"
            >
              How far off route will you go?
            </label>
            <input
              id="detour-limit"
              type="range"
              min={DETOUR_MIN}
              max={DETOUR_MAX}
              step={DETOUR_STEP}
              value={maxDetourMinutes}
              onChange={(event) =>
                setMaxDetourMinutes(Number(event.target.value))
              }
              aria-describedby="detour-limit-value"
              className="mt-4 w-full accent-route"
            />
            <p id="detour-limit-value" className="mt-2 text-ink-soft">
              Up to{" "}
              <span className="font-semibold text-ink">
                {maxDetourMinutes} minutes
              </span>{" "}
              of detour, there and back.
            </p>
          </div>
        </div>
      </section>

      <MapSection stops={shownStops} route={result?.route ?? null} />

      <section
        id="stops"
        aria-labelledby="stops-heading"
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
      >
        <h2 id="stops-heading" className="max-w-[24ch] text-section">
          {hasSearched
            ? `${result.stops.length} ${result.stops.length === 1 ? "stop" : "stops"} worth pulling off for`
            : "What turns up on a run through Appalachia"}
        </h2>

        {hasSearched ? (
          <p className="mt-5 max-w-[62ch] text-lede text-ink-soft">
            {result.query.origin} to {result.query.destination} —{" "}
            {formatDistance(result.route.distanceMeters, units)},{" "}
            {formatDuration(result.route.durationSeconds)} without stopping.
          </p>
        ) : (
          <p className="mt-5 max-w-[62ch] text-lede text-ink-soft">
            A sample of the index. Every entry carries the detour cost and
            whether you can actually get in, so you know what you&rsquo;re
            signing up for before you turn off.
          </p>
        )}

        {hasSearched && result.stops.length === 0 ? (
          <p className="mt-8 max-w-[62ch] border-l-2 border-contour pl-4 text-ink-soft">
            Nothing in the index sits close enough to that route yet. The
            coverage starts in Appalachia and grows outward — try a route
            through West Virginia or western Pennsylvania.
          </p>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shownStops.map((stop) => (
              <li key={stop.id} className="flex">
                <StopCard stop={stop} />
              </li>
            ))}
          </ul>
        )}

        {hasSearched ? (
          <p className="mt-10 text-[0.85rem] text-ink-soft">
            {result.attribution}
          </p>
        ) : null}
      </section>
    </>
  );
}
