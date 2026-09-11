"use client";

import Link from "next/link";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { chooseDisplaySets } from "@/lib/display-sets";
import { tripStore } from "@/lib/trip-store";
import { searchStore, searchKey, PAGE_SIZE } from "@/lib/search-store";
import { distanceKm, orderStopsFrom } from "@/lib/trip-order";
import { CategoryFilters } from "./CategoryFilters";
import { MapSection } from "./MapSection";
import { RouteSearch } from "./RouteSearch";
import { StopCard } from "./StopCard";
import type { RoutedStop } from "@/lib/corridor";
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
  /** Totals for the empty state, so the whole index need not be shipped. */
  stopCount?: number;
  stateCount?: number;
}

interface TripResult {
  query: { origin: string; destination: string };
  route: Route;
  /*
    RoutedStop, not Stop. The API returns each one with how far off the road it
    sits, how far along the route you turn off, and its reveal rank — and the
    page needs all three to show a spread batch in driving order.
  */
  stops: RoutedStop[];
  /** How many matched before the display limit, when that differs. */
  matchedCount?: number;
  attribution: string;
}

/**
 * What to call a place in the trip panel.
 *
 * "Use my location" fills the search field with raw coordinates, because the
 * provider plan has no reverse geocoding. Those are the right thing to send to
 * a router and the wrong thing to show somebody — "40.44031,-79.99589" as the
 * name of where you live reads like a fault.
 */
function placeLabel(typed: string): string {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(typed.trim())
    ? "Your location"
    : typed;
}

/** Sensible ceiling on how far off-route someone will realistically go. */
const DETOUR_MIN = 5;
const DETOUR_MAX = 120;
const DETOUR_STEP = 5;

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
export function TripPlanner({ fallbackStops, allStops, stopCount, stateCount }: TripPlannerProps) {
  /*
    The whole index used to travel inside this page's HTML so the overview map
    could draw. That was a megabyte of markup on the homepage, growing with
    every state — a page that got slower as the project got better.

    Now the counts come as two numbers and the pins are fetched after paint
    from an endpoint the CDN can cache. Nobody looks at the map before the page
    has drawn, so filling it a moment later costs nothing anybody notices.
  */
  const [pins, setPins] = useState<MapStop[] | undefined>(allStops);

  useEffect(() => {
    if (allStops) return;
    let cancelled = false;
    fetch("/api/pins")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPins(data.pins as MapStop[]);
      })
      .catch(() => {
        // The map falls back to the recommended few, which is a reasonable
        // overview on its own.
      });
    return () => {
      cancelled = true;
    };
  }, [allStops]);
  /*
    The search lives outside this component.

    All of this was useState, which meant opening a stop and pressing back
    threw away the route, the results, the filters and the detour setting.
    The component unmounts on navigation; a module-level store does not.
  */
  const search = useSyncExternalStore(
    searchStore.subscribe,
    searchStore.getSnapshot,
    searchStore.getServerSnapshot,
  );
  const {
    status,
    result,
    error,
    categories,
    maxDetourMinutes,
    visibleCount,
    planned,
  } = search;

  const setCategories = useCallback((next: CategorySlug[]) => {
    searchStore.set({ categories: next });
  }, []);
  const setMaxDetourMinutes = useCallback((next: number) => {
    searchStore.set({ maxDetourMinutes: next });
  }, []);
  const setVisibleCount = useCallback((next: number) => {
    searchStore.set({ visibleCount: next });
  }, []);

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
    searchStore.set({ planned: { origin, destination } });
  }, []);

  const wanted = searchKey(planned, categories, maxDetourMinutes);

  useEffect(() => {
    if (!planned || !wanted) return;
    /*
      Already answered.

      Coming back from a stop page restores `planned`, which used to send this
      effect off to re-run a search whose results were already on screen — a
      spent routing request and a flash of "Finding stops" over correct
      results. Comparing against the parameters that produced the current
      result tells the two cases apart: a genuine refinement changes the key,
      a remount does not.
    */
    if (searchStore.getSnapshot().resultKey === wanted) return;

    const timer = setTimeout(async () => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      searchStore.set({ status: "loading", visibleCount: PAGE_SIZE, error: null });

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
          searchStore.set({
            error: data.error ?? "That search didn't work. Try again.",
            status: "error",
          });
          return;
        }

        const found = data as TripResult;

        /*
          The search already said where the trip starts and finishes.

          Without this, adding a stop opened the trip panel and asked for both
          again — after the traveller had typed them into the form at the top
          of the same page and watched a route get drawn between them. The
          search result carries the answer twice over: query.origin and
          query.destination are what was typed, and the route geometry is a
          LineString whose first and last points are where the router resolved
          them to.

          Only filled when empty, so a start chosen by hand in the trip panel
          is not overwritten by refining the detour slider.
        */
        const line = found.route.geometry;
        const first = line?.[0];
        const last = line?.[line.length - 1];

        if (!tripStore.getOrigin() && first) {
          tripStore.setOrigin({
            label: placeLabel(found.query.origin),
            latitude: first[1],
            longitude: first[0],
          });
        }
        if (!tripStore.getDestination() && last) {
          tripStore.setDestination({
            label: placeLabel(found.query.destination),
            latitude: last[1],
            longitude: last[0],
          });
        }

        searchStore.set({
          result: found,
          status: "done",
          resultKey: wanted,
        });
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        searchStore.set({
          error: "Couldn't reach the server. Check your connection and try again.",
          status: "error",
        });
      }
    }, REFINE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [planned, categories, maxDetourMinutes, wanted]);

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
  // Honest numbers for the empty state, from the index we already loaded.
  const totalStops = stopCount ?? pins?.length ?? fallbackStops.length;
  const statesCovered =
    stateCount ?? new Set((pins ?? fallbackStops).map((s) => s.state)).size;

  /*
    Reveal by spreadRank, read by route position.

    The API sends a large spread set so another batch costs no routing call.
    Taking the lowest ranks gives stops spread end to end, and sorting what is
    left by position puts them back in the order they will be driven past.
  */
  const visibleResults = result
    ? [...result.stops]
        .filter((stop) => (stop.spreadRank ?? 0) < visibleCount)
        .sort((a, b) => (a.routePositionKm ?? 0) - (b.routePositionKm ?? 0))
    : null;

  const { listed: listedStops, mapped: mappedStops } = chooseDisplaySets({
    searchResults: visibleResults,
    savedTrip,
    fallbackStops,
    allStops: pins,
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

        {/*
          Heading and the reveal button on one line, button to the right.

          It belongs beside the count rather than below the list: somebody who
          wants more sees it while reading how many there are, instead of
          scrolling past sixty cards to discover the option existed.

          It wraps under the heading on a narrow screen, where a row of two
          would squeeze both.
        */}
        <div className="mt-14 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 first:mt-0">
          <h2 id="stops-heading" className="max-w-[24ch] text-section">
            {hasSearched
              ? `${listedStops.length} ${listedStops.length === 1 ? "stop" : "stops"} worth pulling off for`
              : "OddWay recommendations"}
          </h2>

          {hasSearched && result && listedStops.length < result.stops.length ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-[0.9rem] text-ink-soft">
                {listedStops.length} of {result.matchedCount ?? result.stops.length}
              </span>
              <button
                type="button"
                onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
                className="rounded-[3px] bg-route px-5 py-2 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
              >
                Show me another{" "}
                {Math.min(PAGE_SIZE, result.stops.length - listedStops.length)}
              </button>
            </div>
          ) : null}
        </div>

        {hasSearched ? (
          <p className="mt-5 max-w-[62ch] text-lede text-ink-soft">
            {result.query.origin} to {result.query.destination} —{" "}
            {formatDistance(result.route.distanceMeters, units)},{" "}
            {formatDuration(result.route.durationSeconds)} without stopping.
            {/*
              Say when the list has been thinned. A dense corridor matching two
              hundred stops and showing sixty should not look like a corridor
              with sixty in it — and somebody who wants fewer can say so with
              the detour slider rather than wondering what they are missing.
            */}
            {result.matchedCount && result.matchedCount > listedStops.length ? (
              <>
                {" "}
                Spread along the route, out of {result.matchedCount} within{" "}
                {maxDetourMinutes} minutes.
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-5 max-w-[62ch] text-lede text-ink-soft">
            Three from the index, changing daily. Every entry carries whether
            you can actually get in, so you know what you&rsquo;re signing up
            for before you turn off.
          </p>
        )}

        {hasSearched && result.stops.length === 0 ? (
          /*
            An empty result used to say coverage "starts in Appalachia", which
            was true of seven stops and is not true of three hundred. Saying
            nothing useful is worse than saying nothing: a traveller on I-80
            gets a blank page and concludes the site is broken.

            So this offers the two things that actually help — a wider detour,
            which often finds something, and a way to tell us what we missed.
          */
          <div className="mt-8 max-w-[62ch] border-l-2 border-contour pl-4">
            <p className="text-lede text-ink-soft">
              Nothing in the index is within{" "}
              <span className="font-semibold text-ink">
                {maxDetourMinutes} minutes
              </span>{" "}
              of that route.
            </p>
            <p className="mt-3 text-ink-soft">
              We hold {totalStops} places across {statesCovered} states, but the
              coverage is uneven — some corridors are thin, and long drives
              through the middle of the country are the thinnest of all.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              {maxDetourMinutes < 90 ? (
                <button
                  type="button"
                  onClick={() => setMaxDetourMinutes(90)}
                  className="rounded-[3px] bg-route px-5 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
                >
                  Look within 90 minutes instead
                </button>
              ) : null}

              <Link
                href="/suggest?kind=new_place"
                className="text-[0.95rem] font-semibold text-route underline underline-offset-4"
              >
                Tell us what we&rsquo;re missing there
              </Link>
            </div>
          </div>
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
