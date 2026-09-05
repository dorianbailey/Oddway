"use client";

import { useState } from "react";
import { PlaceField } from "./PlaceField";
import { StopMap } from "./StopMap";
import { NavigationHandoff } from "./NavigationHandoff";
import { useTrip } from "./TripSummary";
import { useUnits } from "./UnitsProvider";
import { formatDuration } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import type { Route, Stop } from "@/types/oddway";

interface DirectionsProps {
  stop: Stop;
}

interface DirectionsResult {
  origin: string;
  route: Route;
  attribution: string;
}

/**
 * Directions to a stop, shown inside OddWay.
 *
 * The route and its manoeuvres render here on OddWay's own map, so planning
 * never leaves the app. Handing off to a native maps app is offered only once
 * a route exists and the traveller is actually setting out — live turn-by-turn
 * guidance, rerouting and traffic are safety-critical problems already solved
 * well by the device's navigation app.
 */
export function Directions({ stop }: DirectionsProps) {
  const { units } = useUnits();
  /*
    If a trip is under way and this stop is part of it, hand the whole trip
    over rather than this one leg. Ignoring the trip here would send someone
    the direct route and quietly discard every other stop they picked.
  */
  const trip = useTrip();
  const inTrip = trip.some((item) => item.id === stop.id);
  const handoffStops = inTrip && trip.length > 1 ? trip : [stop];
  const [origin, setOrigin] = useState("");
  const [result, setResult] = useState<DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  async function request(payload: Record<string, unknown>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          destinationLatitude: stop.latitude,
          destinationLongitude: stop.longitude,
          destinationName: stop.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Couldn't work out that route.");
        return;
      }

      const parsed = data as DirectionsResult;
      setResult(parsed);
      // Show what we actually routed from, so "Use my location" stops looking
      // like it did nothing.
      if (parsed.origin) setOrigin(parsed.origin);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setError("This device can't share its location.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void request({
          originLatitude: position.coords.latitude,
          originLongitude: position.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setError(
          "Couldn't get your location. Type where you're starting from instead.",
        );
      },
      { timeout: 10_000 },
    );
  }

  return (
    <section aria-labelledby="directions-heading" className="mt-14">
      <h2 id="directions-heading" className="text-section">
        Directions
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!origin.trim()) {
                setError("Tell us where you're starting from.");
                return;
              }
              void request({ origin: origin.trim() });
            }}
            className="rounded-[4px] border border-contour/45 bg-paper-raised p-5"
          >
            <PlaceField
              label="Starting from"
              placeholder="Pittsburgh, PA"
              value={origin}
              onValueChange={setOrigin}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-[3px] bg-route px-5 py-2.5 font-semibold text-paper transition-colors hover:bg-[#8a2411] disabled:opacity-60"
              >
                {isLoading ? "Working it out\u2026" : "Show me the way"}
              </button>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating || isLoading}
                className="rounded-[3px] border border-contour/50 px-5 py-2.5 font-semibold transition-colors hover:bg-lichen/40 disabled:opacity-60"
              >
                {locating ? "Finding you\u2026" : "Use my location"}
              </button>
            </div>

            <div role="status" className="mt-4 empty:mt-0">
              {error ? (
                <p className="border-l-2 border-route pl-3 text-[0.95rem] text-ink">
                  {error}
                </p>
              ) : null}
            </div>
          </form>

          {result ? (
            <>
              <p className="mt-6 text-lede">
                {formatDistance(result.route.distanceMeters, units)},{" "}
                {formatDuration(result.route.durationSeconds)} from{" "}
                {result.origin}.
              </p>

              {result.route.steps.length > 0 ? (
                <ol className="mt-5 divide-y divide-contour/30 border-y border-contour/30">
                  {result.route.steps.map((step, index) => (
                    <li
                      key={`${index}-${step.instruction}`}
                      className="flex gap-4 py-3"
                    >
                      <span
                        aria-hidden="true"
                        className="font-display text-[0.85rem] font-bold text-ink-soft"
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1">
                        <span className="block">{step.instruction}</span>
                        {step.distanceMeters > 0 ? (
                          <span className="block text-[0.85rem] text-ink-soft">
                            {formatDistance(step.distanceMeters, units)}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}

              {/* Offered only now that a route exists. */}
              <NavigationHandoff stops={handoffStops} className="mt-6" />

              <p className="mt-4 text-[0.85rem] text-ink-soft">
                {result.attribution}
              </p>
            </>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[4px] border border-contour/45">
          <div className="relative aspect-4/3 lg:aspect-square">
            <StopMap stop={stop} route={result?.route ?? null} />
          </div>
        </div>
      </div>
    </section>
  );
}
