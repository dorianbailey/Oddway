"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL } from "@/lib/map-config";
import type { Route, Stop } from "@/types/oddway";

/**
 * A single stop on a map. Simpler than RouteMap: one marker, fixed zoom, no
 * route, no fitting. Kept separate rather than adding a mode flag to RouteMap,
 * which would have made that component answer two questions at once.
 */
export function StopMap({ stop, route = null }: { stop: Stop; route?: Route | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const container = containerRef.current;
      if (!container) return;

      let maplibregl: typeof import("maplibre-gl");
      try {
        maplibregl = await import("maplibre-gl");
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }
      if (cancelled) return;

      const map = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL,
        center: [stop.longitude, stop.latitude],
        zoom: 12,
        attributionControl: { compact: true },
      });

      const element = document.createElement("div");
      element.className = "oddway-marker";
      element.setAttribute("aria-hidden", "true");

      map.on("style.load", () => {
        if (cancelled) return;

        new maplibregl.Marker({ element })
          .setLngLat([stop.longitude, stop.latitude])
          .addTo(map);

        if (route && route.geometry.length > 1) {
          map.addSource("directions", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: route.geometry },
            },
          });
          map.addLayer({
            id: "directions-line",
            type: "line",
            source: "directions",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              // Read from the palette so a re-skin does not leave the route behind.
        "line-color":
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-route-line")
            .trim() || "#d1502c",
              "line-width": 4,
              "line-opacity": 0.9,
            },
          });
          map.fitBounds(route.bounds, {
            padding: 48,
            animate: !window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches,
          });
        }
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [stop.longitude, stop.latitude, stop.name, route]);

  return (
    <>
      {/*
        Sized with h-full rather than absolute inset-0. MapLibre adds its own
        .maplibregl-map class, which sets position: relative — same specificity
        as Tailwind's .absolute but loaded later, so it wins and the element
        collapses to zero height.
      */}
      <div className="absolute inset-0">
        <div
          ref={containerRef}
          role="application"
          aria-label={`Map showing ${stop.name}`}
          className="h-full w-full"
        />
      </div>
      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center bg-paper-sunk p-4 text-center text-[0.9rem] text-ink-soft">
          Map unavailable. The coordinates are listed below.
        </p>
      ) : null}
    </>
  );
}
