"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL } from "@/lib/map-config";
import type { Stop } from "@/types/oddway";

/**
 * A single stop on a map. Simpler than RouteMap: one marker, fixed zoom, no
 * route, no fitting. Kept separate rather than adding a mode flag to RouteMap,
 * which would have made that component answer two questions at once.
 */
export function StopMap({ stop }: { stop: Stop }) {
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
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [stop.longitude, stop.latitude]);

  return (
    <>
      <div
        ref={containerRef}
        role="application"
        aria-label={`Map showing ${stop.name}`}
        className="absolute inset-0"
      />
      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center bg-paper-sunk p-4 text-center text-[0.9rem] text-ink-soft">
          Map unavailable. The coordinates are listed below.
        </p>
      ) : null}
    </>
  );
}
