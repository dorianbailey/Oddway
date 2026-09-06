"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chooseDisplaySets } from "@/lib/display-sets";
import { tripStore } from "@/lib/trip-store";
import { distanceKm, orderStopsFrom } from "@/lib/trip-order";
import { CategoryFilters } from "./CategoryFilters";
import { MapSection } from "./MapSection";
import { RouteSearch } from "./RouteSearch";
import { StopCard } from "./StopCard";
import { TripSummary } from "./TripSummary";
import { formatDuration } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import { useUnits } from "./UnitsProvider";
import type { CategorySlug, MapStop, Route, Stop } from "@/types/oddway";

interface TripPlannerProps {
  /** Featured before any search runs, so the page is never empty. */
  fallbackStops: Stop[];
  /** Every stop, plotted on the map until a route narrows it down. */
  allStops?: MapStop[];
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
export function TripPlanner({ fallbackStops, allStops }: TripPlannerProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategorySlug[]>([]);
  const [maxDetourMinutes, setMaxDetourMinutes] = useState(DEFAULT_DETOUR);
  const [planned, setPlanned] = useState<PlannedRoute | null>(null);

  /*
    The saved trip, read straight from the store.

    The map used to show the whole index until a search happened, which meant
    that adding stops to a trip changed nothing on screen — the one moment the
    map should be most useful. Now the trip takes precedence: as soon as there
    is one, that is what gets plotted.
  */
  const savedTrip = useSyncExternalStore(
    tripStore.subscribe,
    tripStore.getSnapshot,
    tripStore.getServerSnapshot,
  );

  // The start and finish the traveller chose, which the drawn line has to
  // begin and end at — otherwise it describes a different journey.
  const tripOrigin = useSyncExternalStore(
    tripStore.subscribe,
    tripStore.getOrigin,
    tripStore.getOriginServerSnapshot,
  );
  const tripDestination = useSyncExternalStore(
    tripStore.subscribe,
    tripStore.getDestination,
    tripStore.getDestinationServerSnapshot,
  );

  /*
    The drawn route is stored against the trip it was drawn for.

    Changing the trip therefore invalidates it by derivation rather than by an
    effect that clears state — which is both simpler and avoids the
    setState-in-effect pattern that causes render loops.
  */
  const tripKey = [
    tripOrigin ? `${tripOrigin.latitude},${tripOrigin.longitude}` : "",
    ...savedTrip.map((stop) => stop.id),
    tripDestination ? `${tripDestination.latitude},${tripDestination.longitude}` : "",
  ].join("|");
  const [drawn, setDrawn] = useState<{ key: string; route: Route } | null>(null);
  const [drawnError, setDrawnError] = useState<{ key: string; message: string } | null>(null);
  const [drawingTrip, setDrawingTrip] = useState(false);

  const tripRoute = drawn?.key === tripKey ? drawn.route : null;
  const tripRouteError = drawnError?.key === tripKey ? drawnError.message : null;

  const drawTripRoute = useCallback(async () => {
    /*
      Same ordering the trip panel displays, so the line matches the list.
      Ordering the stops one way and drawing them another would be worse than
      not drawing them at all.
    */
    const ordered = orderStopsFrom(tripOrigin, savedTrip, tripDestination);
    const points = [
      ...(tripOrigin ? [tripOrigin] : []),
      ...ordered,
      ...(tripDestination ? [tripDestination] : []),
    ].map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

    if (points.length < 2) return;

    /*
      Check the span before spending a routing request.

      The free OpenRouteService plan will not draw a route beyond a few
      thousand kilometres, and a trip that wanders from New Jersey to Utah is
      well past it. Finding that out from a rejected request costs quota and
      returns an error about locations, which is not the problem.
    */
    let spanKm = 0;
    for (let i = 1; i < points.length; i += 1) {
      spanKm += distanceKm(points[i - 1], points[i]);
    }

    if (spanKm > 4_000) {
      setDrawnError({
        key: tripKey,
        message: `That's roughly ${Math.round(spanKm * 0.621).toLocaleString()} miles of trip — too far to draw as one route. Split it into a few shorter ones.`,
      });
      return;
    }
    setDrawingTrip(true);
    setDrawnError(null);

    try {
      const response = await fetch("/api/trip-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      const data = await response.json();
      if (!response.ok) {
        setDrawnError({ key: tripKey, message: data.error ?? "Couldn't draw that route." });
        return;
      }
      setDrawn({ key: tripKey, route: data.route });
    } catch {
      setDrawnError({ key: tripKey, message: "Couldn't reach the server." });
    } finally {
      setDrawingTrip(false);
    }
  }, [savedTrip, tripOrigin, tripDestination, tripKey]);
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

  const hasTrip = savedTrip.length > 0;

  /*
    The list and the map answer different questions, so they take different
    sets.

    The list is "what could you add" — search results, or the daily
    recommendations. Pointing it at the saved trip made the recommendations
    vanish the moment you added one of them, which read as the others being
    deleted.

    The map is "what are you looking at", and a trip in progress is the better
    answer to that than a general overview.
  */
  const { listed: listedStops, mapped: mappedStops } = chooseDisplaySets({
    searchResults: result?.stops ?? null,
    savedTrip,
    fallbackStops,
    allStops,
  });
  const hasSearched = status === "done" && result !== null;

  return (
    <>
      <section className="border-b-2 border-ink/70">
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
            <p id="detour-limit-value" className="mt-2 text-ink-soft capitalize">
              Up to{" "}
              <span className="font-semibold text-ink">
                {maxDetourMinutes} minutes
              </span>{" "}
              of detour, there and back.
            </p>
          </div>
        </div>
      </section>

      <MapSection
        stops={mappedStops}
        isOverview={!result && !hasTrip}
        route={result?.route ?? tripRoute}
      />

      <section
        id="stops"
        aria-labelledby="stops-heading"
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
      >
        <TripSummary
          route={result?.route ?? null}
          onDrawRoute={drawTripRoute}
          isDrawingRoute={drawingTrip}
          routeDrawn={tripRoute !== null}
          drawRouteError={tripRouteError}
        />

        <h2 id="stops-heading" className="mt-14 max-w-[24ch] text-section first:mt-0">
          {hasSearched
            ? `${result.stops.length} ${result.stops.length === 1 ? "stop" : "stops"} worth pulling off for`
            : "OddWay recommendations"}
        </h2>

        {hasSearched ? (
          <p className="mt-5 max-w-[62ch] text-lede text-ink-soft">
            {result.query.origin} to {result.query.destination} —{" "}
            {formatDistance(result.route.distanceMeters, units)},{" "}
            {formatDuration(result.route.durationSeconds)} without stopping.
          </p>
        ) : (
          <p className="mt-5 max-w-[62ch] text-lede text-ink-soft">
            Three from the index, changing daily. Every entry carries whether
            you can actually get in, so you know what you&rsquo;re signing up
            for before you turn off.
          </p>
        )}

        {hasSearched && result.stops.length === 0 ? (
          <p className="mt-8 max-w-[62ch] border-l-2 border-contour pl-4 text-ink-soft">
            Nothing in the index sits close enough to that route yet. The
            coverage starts in Appalachia and grows outward — try a route
            through West Virginia or western Pennsylvania.
          </p>
        ) : (
          <ul className="mt-10 grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {listedStops.map((stop) => (
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
