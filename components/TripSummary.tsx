"use client";

import { useState, useSyncExternalStore } from "react";
import { tripStore } from "@/lib/trip-store";
import { NavigationHandoff } from "./NavigationHandoff";
import { PlaceField, type PlaceSuggestion } from "./PlaceField";
import { orderStopsFrom, type TripOrigin } from "@/lib/trip-order";
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

/** Where the trip starts. Null until the traveller says. */
export function useTripOrigin() {
  return useSyncExternalStore(
    tripStore.subscribe,
    tripStore.getOrigin,
    tripStore.getOriginServerSnapshot,
  );
}

/** Where the trip finishes. Often home again. */
export function useTripDestination() {
  return useSyncExternalStore(
    tripStore.subscribe,
    tripStore.getDestination,
    tripStore.getDestinationServerSnapshot,
  );
}

/**
 * A start or finish picker. Typed search with autocomplete, or the device's
 * own location — offered on both because a trip that ends back home is as
 * common as one that starts there.
 */
function PlacePicker({
  label,
  placeholder,
  hint,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  hint: string;
  value: TripOrigin | null;
  onChange: (place: TripOrigin | null) => void;
}) {
  const [draft, setDraft] = useState("");
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange({
          label: "Your location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setLocating(false),
      { timeout: 10_000 },
    );
  }

  if (value) {
    return (
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p>
          <span className="text-[0.9rem] text-ink-soft">{label} </span>
          <span className="font-semibold">{value.label}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setDraft("");
          }}
          className="rounded-[2px] text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <>
      <PlaceField
        label={label}
        placeholder={placeholder}
        value={draft}
        onValueChange={setDraft}
        onSelect={(suggestion: PlaceSuggestion) =>
          onChange({
            label: suggestion.label,
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
          })
        }
      />
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="mt-3 rounded-[3px] border border-contour/50 px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-lichen/40 disabled:opacity-60"
      >
        {locating ? "Finding you…" : "Use my location"}
      </button>
      <p className="mt-3 text-[0.85rem] text-ink-soft">{hint}</p>
    </>
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
  const unordered = useTrip();
  const origin = useTripOrigin();
  const destination = useTripDestination();

  // Ordered once we know where the trip starts, so the sequence is a route
  // rather than the order things happened to be clicked. With a finish too,
  // stops sequence along the corridor between the two.
  const stops = orderStopsFrom(origin, unordered, destination);

  if (unordered.length === 0) return null;

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

      {/*
        Both ends of the trip. The start is what makes sequencing possible at
        all; the finish turns nearest-neighbour into a proper corridor order
        and stops the last thing you clicked becoming your destination.
      */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[3px] border border-contour/40 bg-paper p-4">
          <PlacePicker
            label="Leaving from"
            placeholder="Pittsburgh, PA"
            hint="Where you set off. Lets us put these stops in driving order."
            value={origin}
            onChange={(place) => tripStore.setOrigin(place)}
          />
        </div>

        <div className="rounded-[3px] border border-contour/40 bg-paper p-4">
          <PlacePicker
            label="Ending at"
            placeholder="Asheville, NC"
            hint="Optional. Heading home? Use my location works here too."
            value={destination}
            onChange={(place) => tripStore.setDestination(place)}
          />
        </div>
      </div>

      <NavigationHandoff
        stops={stops}
        origin={origin}
        destination={destination}
        className="mt-6"
      />

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
