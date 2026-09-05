"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  FIT_PADDING,
  MAP_STYLE_URL,
} from "@/lib/map-config";
import { categoryLabel } from "@/lib/categories";
import { formatDetour } from "@/lib/format";
import { useUnits } from "./UnitsProvider";
import type { Route, Stop } from "@/types/oddway";

interface RouteMapProps {
  stops: Stop[];
  /** The drawn route. Null until the routing API is wired up. */
  route?: Route | null;
}

type MapStatus = "loading" | "ready" | "error";

/** How long to wait for the basemap style before calling it a failure. */
const STYLE_LOAD_TIMEOUT_MS = 12_000;

const ROUTE_SOURCE_ID = "oddway-route";
const ROUTE_LAYER_ID = "oddway-route-line";

/**
 * The live map.
 *
 * MapLibre is imported dynamically inside an effect so it never runs during
 * server rendering and stays out of the initial bundle. The map is created
 * once; markers and the route are applied by separate effects so either can
 * change without tearing the map down.
 */
export function RouteMap({ stops, route = null }: RouteMapProps) {
  const { units } = useUnits();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupsRef = useRef<Popup[]>([]);
  const [status, setStatus] = useState<MapStatus>("loading");

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let becameReady = false;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;

    async function init() {
      const container = containerRef.current;
      if (!container) return;

      let maplibregl: typeof import("maplibre-gl");
      try {
        // MapLibre v6 exports named bindings only; there is no default export.
        maplibregl = await import("maplibre-gl");
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }

      if (cancelled) return;

      const map = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: { compact: true },
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-left",
      );

      // A failed style request leaves an empty canvas, so say so explicitly.
      map.on("error", (event) => {
        console.error("MapLibre error:", event.error);
        // Only fatal before the map is usable. Once it is up, a failed tile or
        // sprite must not blank out a working map.
        if (!cancelled && !becameReady) setStatus("error");
      });

      // "style.load" fires once the style JSON is parsed and applied, which is
      // all we need to add sources, draw the route and place markers.
      // "load" additionally waits for the first tiles to render — if the tile
      // source is slow or unreachable it may never fire at all, which would
      // leave the whole panel stuck. Take whichever arrives first.
      const markReady = () => {
        if (cancelled) return;
        // Cancel the watchdog. Without this it fires later and flips a working
        // map to "error", because isStyleLoaded() reports false while sources
        // are still settling.
        if (loadTimer) clearTimeout(loadTimer);
        becameReady = true;
        setStatus("ready");
      };
      map.on("style.load", markReady);
      map.on("load", markReady);

      // A style request that never resolves would otherwise leave the panel
      // reading "Loading the map…" forever, with no way to tell that anything
      // is wrong. Fail loudly instead.
      loadTimer = setTimeout(() => {
        if (!cancelled && !becameReady && !map.isStyleLoaded()) {
          console.error(
            `MapLibre: style did not load within ${STYLE_LOAD_TIMEOUT_MS}ms — ${MAP_STYLE_URL}`,
          );
          setStatus("error");
        }
      }, STYLE_LOAD_TIMEOUT_MS);

      mapRef.current = map;
    }

    void init();

    return () => {
      cancelled = true;
      if (loadTimer) clearTimeout(loadTimer);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      popupsRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Scale bar, rebuilt when the unit preference changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    let control: import("maplibre-gl").IControl | null = null;
    let cancelled = false;

    void (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !mapRef.current) return;
      control = new maplibregl.ScaleControl({ unit: units });
      mapRef.current.addControl(control, "bottom-left");
    })();

    return () => {
      cancelled = true;
      if (control && mapRef.current) {
        try {
          mapRef.current.removeControl(control);
        } catch {
          // Map already torn down.
        }
      }
    };
  }, [units, status]);

  // Plot the stops.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    let cancelled = false;

    async function plot() {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !map) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      popupsRef.current = [];

      stops.forEach((stop, index) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "oddway-marker";
        element.textContent = String(index + 1);
        element.setAttribute(
          "aria-label",
          `${stop.name}, ${stop.city}, ${stop.state}`,
        );

        // Built as DOM nodes rather than an HTML string so that descriptions
        // coming from the database later can never inject markup.
        const content = document.createElement("div");
        content.className = "oddway-popup";

        const heading = document.createElement("p");
        heading.className = "oddway-popup-name";
        heading.textContent = stop.name;

        const place = document.createElement("p");
        place.className = "oddway-popup-meta";
        place.textContent = `${categoryLabel(stop.category)} · ${stop.city}, ${stop.state}`;

        const detour = document.createElement("p");
        detour.className = "oddway-popup-meta";
        detour.textContent = formatDetour(stop.detourMinutes);

        content.append(heading, place, detour);

        const popup = new maplibregl.Popup({
          offset: 22,
          closeButton: true,
          maxWidth: "260px",
        }).setDOMContent(content);

        const marker = new maplibregl.Marker({ element })
          .setLngLat([stop.longitude, stop.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
        popupsRef.current.push(popup);
      });

      // With no route yet, frame the stops instead.
      if (!route && stops.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        stops.forEach((stop) =>
          bounds.extend([stop.longitude, stop.latitude]),
        );
        map.fitBounds(bounds, {
          padding: FIT_PADDING,
          maxZoom: 9,
          animate: !prefersReducedMotion(),
        });
      }
    }

    void plot();

    return () => {
      cancelled = true;
    };
  }, [stops, route, status]);

  // Draw the route, once there is one.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

    if (!route) return;

    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: route.geometry },
      },
    });

    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#b23c18",
        "line-width": 4,
        "line-opacity": 0.9,
      },
    });

    map.fitBounds(route.bounds, {
      padding: FIT_PADDING,
      animate: !prefersReducedMotion(),
    });
  }, [route, status]);

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        role="application"
        aria-label="Map of stops along the route"
        className="h-full w-full"
      />

      {status === "loading" ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center bg-paper-sunk text-ink-soft">
          Loading the map…
        </p>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-paper-sunk p-6">
          <p className="max-w-[44ch] border-l-2 border-route pl-4 text-ink">
            The map couldn&rsquo;t load — the basemap provider didn&rsquo;t
            respond. Your route and stops are still listed below, and you can
            point NEXT_PUBLIC_MAP_STYLE_URL at a different provider.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
