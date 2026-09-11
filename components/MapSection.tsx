import { RouteMap } from "./RouteMap";
import type { MapStop, Route } from "@/types/oddway";

interface MapSectionProps {
  /** Whatever the caller has decided to plot. */
  stops: MapStop[];
  /** True when these are the whole index rather than a search or a trip. */
  isOverview?: boolean;
  /** The drawn route. Null until the routing API exists. */
  route?: Route | null;
  /**
   * What this map is showing.
   *
   * Defaults to the trip planner's wording, because that is where the band
   * started and where it is used most. The bucket list plots the same
   * component above a completely different idea, and a heading about routes
   * and detours over somebody's saved places would be the sort of copy that
   * is technically present and actually wrong.
   */
  heading?: string;
  intro?: string;
  /**
   * The line under the map. Null hides it.
   *
   * The default explains that an unrouted map is the whole index, which is
   * true on the homepage and nowhere else.
   */
  note?: string | null;
  /** Distinct id, so two map bands on one page do not share a label. */
  id?: string;
}

/**
 * The map band.
 *
 * This is a server component: it renders the heading, the copy and a text
 * fallback, and delegates the interactive canvas to <RouteMap />, which is the
 * only client component involved. The stop list below the map is not a
 * decoration — a WebGL canvas is unreadable to assistive technology, so the
 * list is the accessible equivalent and stays in the DOM either way.
 */
export function MapSection({
  stops: plotted,
  isOverview = false,
  route = null,
  heading = "See the whole route and everything odd beside it",
  intro = "OddWay draws your route first, then plots every stop that falls inside the detour you're willing to make. No hunting through a list to work out what is actually on the way.",
  note,
  id = "map",
}: MapSectionProps) {
  const headingId = `${id}-heading`;

  /*
    Undefined means "use the default", null means "no line at all". They are
    different answers and collapsing them would make the line impossible to
    turn off.
  */
  const footnote =
    note === undefined
      ? route === null
        ? `Every one of the ${plotted.length} places in the index. Plan a route and the map narrows to what's actually near it.`
        : null
      : note;

  return (
    <section
      id={id}
      data-surface="dark"
      aria-labelledby={headingId}
      className="bg-pine-deep text-paper"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 id={headingId} className="max-w-[20ch] text-section">
          {heading}
        </h2>
        <p className="mt-5 max-w-[62ch] text-lede text-lichen">{intro}</p>

        <div className="relative mt-10 aspect-4/3 overflow-hidden rounded-[4px] border border-brass/30 bg-paper-sunk sm:aspect-16/9">
          <RouteMap
            stops={plotted}
            route={route}
            markerStyle={isOverview ? "dot" : "numbered"}
          />
        </div>

        {footnote ? (
          <p className="mt-5 max-w-[62ch] border-l-2 border-brass pl-4 text-[0.95rem] text-lichen">
            {footnote}
          </p>
        ) : null}

        {/* Text equivalent of the map, and the path when WebGL is unavailable. */}
      </div>
    </section>
  );
}
