"use client";

import { useMemo, useState } from "react";
import { cx } from "@/lib/cx";
import { daysUntil, hasFinished, likelyRecurrence } from "@/lib/events";
import { distanceKm } from "@/lib/trip-order";
import { formatDistanceFromKm } from "@/lib/units";
import { stateName } from "@/lib/us-states";
import { useUnits } from "./UnitsProvider";
import { EVENT_CATEGORY_LABELS, type OddEvent } from "@/types/events";

type SortMode = "name" | "date" | "distance";

export function EventList({ events }: { events: OddEvent[] }) {
  const { units } = useUnits();
  const [sort, setSort] = useState<SortMode>("name");
  const [showPast, setShowPast] = useState(false);
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const withDistance = useMemo(
    () =>
      events.map((event) => ({
        event,
        finished: hasFinished(event),
        until: daysUntil(event),
        km:
          here && event.latitude !== null && event.longitude !== null
            ? distanceKm(
                { latitude: here.lat, longitude: here.lon },
                { latitude: event.latitude, longitude: event.longitude },
              )
            : null,
      })),
    [events, here],
  );

  const visible = useMemo(() => {
    /*
      Hiding finished events is right in September and wrong in March, when
      every event in the index has passed and hiding them leaves a blank page.
      So they are hidden only while there is something else to show.
    */
    const upcoming = withDistance.filter((row) => !row.finished);
    const rows = showPast || upcoming.length === 0 ? withDistance : upcoming;

    return [...rows].sort((a, b) => {
      if (sort === "distance") {
        // Events we cannot place sort last rather than pretending to be near.
        if (a.km === null && b.km === null) return a.event.name.localeCompare(b.event.name);
        if (a.km === null) return 1;
        if (b.km === null) return -1;
        return a.km - b.km;
      }
      if (sort === "date") {
        // A finished event sorts by when it is next expected, not by the date
        // it last happened — otherwise last spring's festivals sit at the top
        // of a list meant to answer "what is coming up".
        const when = (row: typeof a) =>
          row.finished
            ? (likelyRecurrence(row.event)?.nextDate ?? "9999-12-31")
            : (row.event.startDate ?? "9999-12-31");
        return when(a).localeCompare(when(b));
      }
      return a.event.name.localeCompare(b.event.name);
    });
  }, [withDistance, sort, showPast]);

  const pastCount = withDistance.filter((row) => row.finished).length;

  function findMe() {
    if (!("geolocation" in navigator)) {
      setLocationError("This device can't share its location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setHere({ lat: position.coords.latitude, lon: position.coords.longitude });
        setSort("distance");
      },
      () => {
        setLocating(false);
        setLocationError("Couldn't get your location.");
      },
      { timeout: 10_000 },
    );
  }

  return (
    <>
      <div className="rounded-[4px] border border-contour/45 bg-paper-raised p-4">
        {here ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <p>
              <span className="text-[0.9rem] text-ink-soft">
                Measuring from{" "}
              </span>
              <span className="font-semibold">your location</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setHere(null);
                if (sort === "distance") setSort("name");
              }}
              className="rounded-[2px] text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              Forget it
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={findMe}
              disabled={locating}
              className="rounded-[3px] bg-route px-5 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-60"
            >
              {locating ? "Finding you…" : "Show me what's near me"}
            </button>
            <p className="text-[0.9rem] text-ink-soft">
              Your browser will ask permission. Nothing is stored or sent
              anywhere — distances are worked out on your device.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div role="group" aria-label="Sort events" className="flex flex-wrap gap-2">
          {(
            [
              ["name", "A to Z"],
              ["date", "Soonest"],
              ["distance", "Nearest"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={sort === mode}
              disabled={mode === "distance" && !here}
              title={
                mode === "distance" && !here
                  ? "Share your location first"
                  : undefined
              }
              onClick={() => setSort(mode)}
              className={cx(
                "rounded-full border px-4 py-2 text-[0.95rem] transition-colors",
                sort === mode
                  ? "border-pine bg-pine font-semibold text-paper"
                  : "border-contour/50 bg-paper-raised hover:border-contour hover:bg-lichen/40",
                mode === "distance" && !here && "cursor-not-allowed opacity-45",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {pastCount > 0 ? (
          <label className="flex items-center gap-2 text-[0.95rem] text-ink-soft">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(event) => setShowPast(event.target.checked)}
              className="accent-route"
            />
            Show the {pastCount} that already happened this year
          </label>
        ) : null}
      </div>

      <p role="status" className="mt-3 text-[0.95rem] text-ink-soft">
        {locationError ??
          `${visible.length} ${visible.length === 1 ? "event" : "events"}${here ? ", nearest first" : ""}.`}
      </p>

      <p className="mt-6 border-l-2 border-contour pl-4 text-[0.95rem] text-ink-soft">
        Small festivals move, change hands and take years off. Everything here
        was researched by hand, but check the organiser&rsquo;s page before you
        set off — some of these are run by a handful of volunteers and a
        Facebook account.
      </p>

      <ul className="mt-8 divide-y divide-contour/30 border-y border-contour/30">
        {visible.map(({ event, finished, until, km }) => (
          <li key={event.id} className="py-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h2 className="text-title">
                {event.website ? (
                  <a
                    href={withProtocol(event.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:text-route hover:underline"
                  >
                    {event.name}
                  </a>
                ) : (
                  event.name
                )}
              </h2>
              <span className="rounded-full bg-lichen px-3 py-0.5 text-[0.8rem] font-semibold text-ink">
                {EVENT_CATEGORY_LABELS[event.category]}
              </span>
              {km !== null ? (
                <span className="ml-auto font-semibold">
                  {formatDistanceFromKm(km, units)} away
                </span>
              ) : here ? (
                <span className="ml-auto text-[0.9rem] text-ink-soft">
                  Distance unknown
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-ink-soft">
              {event.city}, {stateName(event.state)}
            </p>

            <p className="mt-3">
              <span className={cx(finished && "text-ink-soft")}>
                {event.displayDate ?? "Date not published"}
              </span>
              {/*
                Estimated dates are marked every time they appear. Rendering a
                guess the same way as an announcement is how somebody ends up
                at an empty field.
              */}
              {event.dateConfidence === "estimated" ? (
                <span className="ml-2 rounded-[2px] border border-contour/60 px-2 py-0.5 text-[0.8rem] text-ink-soft">
                  Estimated — confirm before travelling
                </span>
              ) : null}
            </p>

            {!finished && until !== null && until >= 0 ? (
              <p className="mt-1 text-[0.9rem] text-ink-soft">
                {until === 0
                  ? "Happening today"
                  : until === 1
                    ? "Tomorrow"
                    : `In ${until} days`}
              </p>
            ) : null}

            {/*
              A finished event is not a dead one. Showing when it usually falls
              means the page still answers "when can I go" in March, instead of
              being a list of things that already happened.

              Phrased as a pattern and an expectation, never as a date, because
              a computed date presented as fact is exactly the failure the
              estimated-date marker exists to prevent.
            */}
            {finished
              ? (() => {
                  const recurrence = likelyRecurrence(event);
                  if (!recurrence) {
                    return (
                      <p className="mt-1 text-[0.9rem] text-ink-soft">
                        Finished for this year.
                      </p>
                    );
                  }
                  return (
                    <p className="mt-1 text-[0.9rem] text-ink-soft">
                      Finished for this year. Usually {recurrence.pattern}, so
                      expect it around{" "}
                      {new Date(`${recurrence.nextDate}T00:00:00Z`).toLocaleDateString(
                        "en-US",
                        { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" },
                      )}{" "}
                      — confirm with the organiser before planning around it.
                    </p>
                  );
                })()
              : null}

            <p className="mt-3 text-[0.95rem]">
              {event.website ? (
                <a
                  href={withProtocol(event.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-route underline underline-offset-4"
                >
                  {isFacebook(event.website)
                    ? "Check their Facebook page"
                    : "Check the official site"}
                </a>
              ) : (
                /*
                  No link at all. Saying so plainly is more useful than silence:
                  it tells the traveller the gap is real and they should ask
                  locally rather than assume we simply didn't bother.
                */
                <span className="text-ink-soft">
                  No official page found — worth ringing the town or county
                  visitor centre before travelling.
                </span>
              )}
            </p>

            {event.contact ? (
              <p className="mt-2 max-w-[70ch] text-[0.9rem] text-ink-soft">
                {event.contact}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

/** The spreadsheet lists bare domains; links need a scheme. */
function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** For a lot of these festivals the Facebook page is the official presence. */
function isFacebook(url: string): boolean {
  return /facebook\.com|fb\.com/i.test(url);
}
