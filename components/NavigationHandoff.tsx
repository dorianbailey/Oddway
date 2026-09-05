"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";
import type { Stop } from "@/types/oddway";

interface NavigationHandoffProps {
  /** Stops in route order. One for a single-stop handoff, many for a trip. */
  stops: Stop[];
  /** Where the drive starts, when known. Omitted means current location. */
  origin?: { latitude: number; longitude: number } | null;
  /** Where it finishes. When set, every stop becomes an intermediate waypoint. */
  destination?: { latitude: number; longitude: number; label: string } | null;
  className?: string;
}

const NO_OP_SUBSCRIBE = () => () => {};

/**
 * Google Maps caps intermediate waypoints in a URL. Beyond this the link is
 * silently truncated, which would quietly drop stops from someone's trip.
 */
const GOOGLE_WAYPOINT_LIMIT = 9;

/**
 * Handing off to a navigation app.
 *
 * The point of OddWay is the detour, so a handoff that sends someone the
 * fastest direct route throws the whole trip away. Google Maps accepts
 * intermediate waypoints in a URL, so the planned route goes across intact.
 *
 * Waze and Apple Maps accept a single destination only — neither URL scheme
 * supports multi-stop routes. Rather than pretend otherwise, they are labelled
 * as navigating to the next stop, which is how people drive a multi-stop trip
 * anyway: one leg at a time.
 */
export function NavigationHandoff({
  stops,
  origin = null,
  destination = null,
  className,
}: NavigationHandoffProps) {
  const panelId = useId();
  const dialogId = useId();
  const [isOpen, setIsOpen] = useState(false);

  /*
    A single-destination app the traveller has chosen but not yet confirmed.
    Held here so the warning can be shown and acknowledged before we hand the
    trip over to something that can only carry one stop of it.
  */
  const [pending, setPending] = useState<{ label: string; href: string } | null>(
    null,
  );
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // showModal gives a focus trap, Escape-to-close and an inert background
    // for free, which a div-based modal would have to reimplement badly.
    if (pending && !dialog.open) dialog.showModal();
    if (!pending && dialog.open) dialog.close();
  }, [pending]);

  const isApple = useSyncExternalStore(
    NO_OP_SUBSCRIBE,
    () => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent),
    () => false,
  );

  if (stops.length === 0) return null;

  const next = stops[0];

  // With an explicit finish, nothing gets promoted to destination — the whole
  // list stays as waypoints and the drive ends where the traveller said.
  const finalName = destination ? destination.label : stops[stops.length - 1].name;
  const finalPoint = destination ?? stops[stops.length - 1];
  const waypoints = destination ? stops : stops.slice(0, -1);
  const isMultiStop = stops.length > 1 || destination !== null;
  const truncated = waypoints.length > GOOGLE_WAYPOINT_LIMIT;

  const google = {
    id: "google",
    label: "Google Maps",
    href: buildGoogleUrl(origin, finalPoint, waypoints),
    note: isMultiStop
      ? truncated
        ? `First ${GOOGLE_WAYPOINT_LIMIT} stops, then ${finalName}`
        : `All ${stops.length} stops, ending at ${finalName}`
      : undefined,
  };

  // Neither of these can take a multi-stop route from a link, so on a trip
  // they are the fallback rather than an equal choice.
  const stopByStop: Array<{ id: string; label: string; href: string }> = [
    {
      id: "waze",
      label: "Waze",
      href: `https://waze.com/ul?ll=${next.latitude},${next.longitude}&navigate=yes`,
    },
  ];

  if (isApple) {
    stopByStop.unshift({
      id: "apple",
      label: "Apple Maps",
      href: `https://maps.apple.com/?daddr=${next.latitude},${next.longitude}&dirflg=d`,
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full rounded-[3px] border border-pine px-4 py-2.5 font-semibold text-pine transition-colors hover:bg-lichen/50"
      >
        {isMultiStop ? "Start driving this trip" : "Start driving"}
      </button>

      <div
        id={panelId}
        className={cx(
          "mt-2 rounded-[3px] border border-contour/45 bg-paper-raised p-3",
          !isOpen && "hidden",
        )}
      >
        {/* Google carries the whole route, so it leads. */}
        <a
          href={google.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-[3px] bg-route px-4 py-3 text-paper transition-colors hover:bg-[#8a2411]"
        >
          <span className="font-semibold">{google.label}</span>
          {google.note ? (
            <span className="block text-[0.85rem] text-paper/85">
              {google.note}
            </span>
          ) : null}
        </a>

        {isMultiStop ? (
          <p className="mt-3 text-[0.85rem] text-ink-soft">
            Google Maps is the only one that takes a whole route from a link.
            The others below can only hold one destination, so you&rsquo;d set
            the next stop again each time you arrive.
          </p>
        ) : null}

        {isMultiStop ? (
          <p className="mt-4 border-t border-contour/30 pt-3 text-[0.85rem] font-semibold text-ink-soft">
            Or go one stop at a time
          </p>
        ) : null}

        <ul className="mt-1">
          {stopByStop.map((option) => (
            <li key={option.id}>
              <a
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  // On a trip, make the limitation impossible to miss.
                  if (!isMultiStop) return;
                  event.preventDefault();
                  setPending({ label: option.label, href: option.href });
                }}
                className="block rounded-[2px] px-2 py-2.5 transition-colors hover:bg-lichen/40"
              >
                <span className="font-semibold">{option.label}</span>
                <span className="block text-[0.85rem] text-ink-soft">
                  {isMultiStop
                    ? `One stop at a time \u2014 starts with ${next.name}`
                    : `Takes you to ${next.name}`}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {!isMultiStop ? (
        <p className="mt-3 text-[0.85rem] text-ink-soft">
          Navigation runs in that app. Your trip stays here.
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogId}
        onClose={() => setPending(null)}
        onClick={(event) => {
          // Clicking the backdrop, rather than the panel, dismisses it.
          if (event.target === dialogRef.current) setPending(null);
        }}
        className="w-[min(30rem,calc(100vw-2rem))] rounded-[4px] border border-contour/45 bg-paper-raised p-0 text-ink backdrop:bg-pine-deep/60"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={dialogId} className="text-title">
              {pending?.label} takes one stop at a time
            </h2>
            <button
              type="button"
              onClick={() => setPending(null)}
              aria-label="Close"
              className="-mt-1 rounded-[2px] px-2 py-1 text-xl leading-none text-ink-soft transition-colors hover:text-ink"
            >
              &times;
            </button>
          </div>

          <p className="mt-4 text-ink-soft">
            Google Maps is the only one that takes a whole route from a link.{" "}
            {pending?.label} can only hold one destination, so it will take you
            to <span className="font-semibold text-ink">{next.name}</span> and
            you&rsquo;d set the next stop again each time you arrive.
          </p>

          <p className="mt-3 text-ink-soft">
            Your trip stays here in OddWay either way.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={pending?.href ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPending(null)}
              className="rounded-[3px] border border-pine px-5 py-2.5 font-semibold text-pine transition-colors hover:bg-lichen/50"
            >
              Continue to {pending?.label}
            </a>
            <a
              href={google.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPending(null)}
              className="rounded-[3px] bg-route px-5 py-2.5 font-semibold text-paper transition-colors hover:bg-[#8a2411]"
            >
              Use Google Maps instead
            </a>
          </div>
        </div>
      </dialog>
    </div>
  );
}

/**
 * Google's directions URL. Waypoints are pipe-separated and kept in order, so
 * the drive follows the route OddWay planned rather than the fastest line.
 */
function buildGoogleUrl(
  origin: { latitude: number; longitude: number } | null,
  destination: { latitude: number; longitude: number },
  waypoints: Stop[],
): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("travelmode", "driving");
  url.searchParams.set(
    "destination",
    `${destination.latitude},${destination.longitude}`,
  );

  if (origin) {
    url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
  }

  if (waypoints.length > 0) {
    url.searchParams.set(
      "waypoints",
      waypoints
        .slice(0, GOOGLE_WAYPOINT_LIMIT)
        .map((stop) => `${stop.latitude},${stop.longitude}`)
        .join("|"),
    );
  }

  return url.toString();
}
