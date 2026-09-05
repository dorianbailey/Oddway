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
        <button
          type="button"
          onClick={handleSwap}
          className="inline-flex items-center gap-2 rounded-[2px] text-[0.95rem] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          <SwapIcon />
          Swap start and destination
        </button>

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
