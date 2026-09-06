import { RouteMap } from "./RouteMap";
import type { MapStop, Route, Stop } from "@/types/oddway";

interface MapSectionProps {
  stops: Stop[];
  /** Every stop we hold, plotted when no route has been planned yet. */
  allStops?: MapStop[];
  /** The drawn route. Null until the routing API exists. */
  route?: Route | null;
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
  stops,
  allStops,
  route = null,
}: MapSectionProps) {
  // Before a search, the map is a picture of everything OddWay knows. After
  // one, it narrows to the stops actually near the route.
  const plotted = route ? stops : (allStops ?? stops);
  const isOverview = !route && allStops !== undefined;
  return (
    <section
      id="map"
      data-surface="dark"
      aria-labelledby="map-heading"
      className="bg-pine-deep text-paper"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <h2 id="map-heading" className="max-w-[20ch] text-section">
          See the whole route and everything odd beside it
        </h2>
        <p className="mt-5 max-w-[62ch] text-lede text-lichen">
          OddWay draws your route first, then plots every stop that falls inside
          the detour you&rsquo;re willing to make. No hunting through a list to
          work out what is actually on the way.
        </p>

        <div className="relative mt-10 aspect-4/3 overflow-hidden rounded-[4px] border border-brass/30 bg-paper-sunk sm:aspect-16/9">
          <RouteMap
            stops={plotted}
            route={route}
            markerStyle={isOverview ? "dot" : "numbered"}
          />
        </div>

        {route === null ? (
          <p className="mt-5 max-w-[62ch] border-l-2 border-brass pl-4 text-[0.95rem] text-lichen">
            Every one of the {plotted.length} places in the index. Plan a route
            and the map narrows to what&rsquo;s actually near it.
          </p>
        ) : null}

        {/* Text equivalent of the map, and the path when WebGL is unavailable. */}
      </div>
    </section>
  );
}
