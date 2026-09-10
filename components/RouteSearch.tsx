"use client";

import { useId, useState, type FormEvent } from "react";
import { cx } from "@/lib/cx";
import { PlaceField } from "./PlaceField";

interface RouteSearchProps {
  className?: string;
  /** Called with validated input. When omitted, the form explains it can't plan yet. */
  onPlan?: (origin: string, destination: string) => void;
  isLoading?: boolean;
  /** An error from the server, shown beneath the fields. */
  serverError?: string | null;
}

interface FieldErrors {
  origin?: string;
  destination?: string;
}

/**
 * The route form. It validates and manages its own state but deliberately does
 * not call anything — there is no routing provider wired up yet, and showing
 * invented results would be worse than saying so.
 *
 * When the routing API lands, replace the body of `handleSubmit` with the
 * request and lift `origin`/`destination` into a shared trip store so the map
 * and the results list can read them.
 */
export function RouteSearch({
  className,
  onPlan,
  isLoading = false,
  serverError = null,
}: RouteSearchProps) {
  const originId = useId();
  const destinationId = useId();

  const [origin, setOrigin] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!origin.trim()) {
      nextErrors.origin = "Enter the town or address you're leaving from.";
    }
    if (!destination.trim()) {
      nextErrors.destination = "Enter where you're headed.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus(null);
      // Send the user straight to the field that needs fixing.
      const firstInvalid = nextErrors.origin ? originId : destinationId;
      requestAnimationFrame(() => {
        document.getElementById(firstInvalid)?.focus();
      });
      return;
    }

    if (onPlan) {
      setStatus(null);
      onPlan(origin.trim(), destination.trim());
      return;
    }

    setStatus(
      `Routing between ${origin.trim()} and ${destination.trim()} isn't switched on yet. The stops further down show what a finished result looks like.`,
    );
  }

  function handleUseMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("This device can't share its location.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        // Five decimal places is about a metre. More is false precision.
        setOrigin(
          `${position.coords.latitude.toFixed(5)},${position.coords.longitude.toFixed(5)}`,
        );
      },
      (error) => {
        setLocating(false);
        /*
          Each failure gets its own sentence, because they need different
          things from the person. "Couldn't get your location" for all three
          left somebody who had denied permission waiting for it to work, and
          somebody indoors on a desktop retrying forever.
        */
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. You can allow it in your browser settings, or type a starting point."
            : error.code === error.TIMEOUT
              ? "That took too long. Try again, or type a starting point."
              /*
                POSITION_UNAVAILABLE with permission already granted almost
                always means the operating system's own location service is
                off, not the browser's. On macOS that setting lives in Privacy
                and Security and is quietly turned off by some updates, so
                pointing at the browser would send somebody looking in the
                wrong place entirely.
              */
              : "Your device didn't return a location. Check location services are on in your system settings, or type a starting point.",
        );
      },
      /*
        Thirty seconds, not ten.

        A laptop with no GPS locates itself from nearby wifi networks, and that
        can take fifteen or twenty seconds on a first attempt — long enough
        that a ten-second limit was reporting failure on requests that were
        about to succeed.

        maximumAge lets a fix from the last five minutes be reused, which makes
        a second attempt instant.
      */
      { timeout: 30_000, maximumAge: 300_000 },
    );
  }

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
  }

  return (
    <form
      id="plan"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={`${originId}-heading`}
      className={cx(
        "rounded-[4px] border border-contour/45 bg-paper-raised p-5 shadow-[0_1px_0_0_var(--color-contour)] sm:p-7",
        className,
      )}
    >
      <h2 id={`${originId}-heading`} className="sr-only">
        Plan a route
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <PlaceField
          id={originId}
          label="Starting from"
          placeholder="Pittsburgh, PA"
          value={origin}
          onValueChange={setOrigin}
          error={errors.origin}
        />
        <PlaceField
          id={destinationId}
          label="Going to"
          placeholder="Asheville, NC"
          value={destination}
          onValueChange={setDestination}
          error={errors.destination}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {/*
            Fills the starting point with raw coordinates rather than a place
            name. Reverse geocoding is not available on our provider plan, and
            the router only needs a point — so the field shows the coordinates
            and the results label them "Your location".
          */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-2 rounded-[2px] text-[0.95rem] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-60"
          >
            <LocationIcon />
            {locating ? "Finding you…" : "Use my location"}
          </button>

        <button
          type="button"
          onClick={handleSwap}
          className="inline-flex items-center gap-2 rounded-[2px] text-[0.95rem] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          <SwapIcon />
          Swap start and destination
        </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Finding stops\u2026" : "Find strange stops"}
        </button>
      </div>

      {/*
        The live region stays mounted and empty so assistive tech announces the
        message when it appears. Rendering it only on success would mean the
        region is created and populated in the same tick, which many screen
        readers miss.
      */}
      <div role="status" className="mt-5 empty:mt-0">
        {locationError ? (
        <p role="status" className="mt-4 text-[0.95rem] text-route">
          {locationError}
        </p>
      ) : null}

      {serverError ? (
          <p className="max-w-[68ch] border-l-2 border-route pl-4 text-[0.95rem] text-ink">
            {serverError}
          </p>
        ) : null}
        {status && !serverError ? (
          <p className="max-w-[68ch] border-l-2 border-contour pl-4 text-[0.95rem] text-ink-soft">
            {status}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 .5v2M8 13.5v2M.5 8h2M13.5 8h2" strokeLinecap="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 5.5h10.5L10 3" />
      <path d="M14 10.5H3.5L6 13" />
    </svg>
  );
}
