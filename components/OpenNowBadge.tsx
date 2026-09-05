"use client";

import { useEffect, useState } from "react";
import { evaluateOpenNow, type OpenNowResult } from "@/lib/opening-hours";
import { cx } from "@/lib/cx";

interface OpenNowBadgeProps {
  openingHours: string | null;
  /** IANA zone for the venue, e.g. "America/New_York". */
  timezone: string | null;
  className?: string;
}

/**
 * Open / closed right now.
 *
 * Client-only on purpose. Pages are prerendered at build time, so evaluating
 * this on the server would bake in whatever the answer was when the build ran
 * and show it for days. Rendering nothing until mounted also keeps the server
 * and client markup identical, avoiding a hydration mismatch.
 *
 * Re-checks every minute so the badge flips while the page is open.
 */
export function OpenNowBadge({
  openingHours,
  timezone,
  className,
}: OpenNowBadgeProps) {
  const [result, setResult] = useState<OpenNowResult | null>(null);

  useEffect(() => {
    if (!openingHours || !timezone) return;

    const check = () => setResult(evaluateOpenNow(openingHours, timezone));
    check();

    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, [openingHours, timezone]);

  // Nothing rendered before hydration, or when we genuinely cannot tell.
  if (!result || result.state === "unknown") return null;

  const isOpen = result.state === "open";

  return (
    <p
      role="status"
      className={cx("flex flex-wrap items-baseline gap-x-3", className)}
    >
      <span
        className={cx(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.85rem] font-semibold",
          isOpen ? "bg-lichen text-pine-deep" : "bg-paper-sunk text-ink-soft",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "h-2 w-2 rounded-full",
            isOpen ? "bg-pine" : "bg-ink-soft/50",
          )}
        />
        {isOpen ? "Open now" : "Closed now"}
      </span>

      {result.detail ? (
        <span className="text-[0.9rem] text-ink-soft">{result.detail}</span>
      ) : null}

      {/*
        When a holiday or seasonal rule exists that we could not evaluate, the
        badge must not read as a promise.
      */}
      {result.caveat && isOpen ? (
        <span className="w-full text-[0.8rem] text-ink-soft">
          {result.caveat} — worth confirming.
        </span>
      ) : null}
    </p>
  );
}
