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
import type { MapStop, Route } from "@/types/oddway";

interface RouteMapProps {
  stops: MapStop[];
  /** The drawn route. Null until the routing API is wired up. */
  route?: Route | null;
  /**
   * "numbered" ties markers to a results list. "dot" is for showing the whole
   * index at once, where numbering hundreds of pins would be meaningless.
   */
  markerStyle?: "numbered" | "dot";
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
export function RouteMap({
  stops,
  route = null,
  markerStyle = "numbered",
}: RouteMapProps) {
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

      /*
        Above a certain size the overview map stops using DOM markers.

        Every marker is a real element with its own listeners, which is fine
        for the dozen stops on a route and hopeless for the whole index — a
        thousand of them makes panning stutter on a phone. A clustered GeoJSON
        source draws on the GPU instead: at low zoom you see counts, and
        individual places appear as you go in.

        Numbered markers keep the DOM path. They are tied to a results list by
        their number, and a cluster cannot show that.
      */
      const clustered = markerStyle === "dot" && stops.length > CLUSTER_ABOVE;

      if (clustered) {
        plotClusters(maplibregl, map, stops);
        frameStops(maplibregl, map, stops, route);
        return;
      }

      removeClusterLayers(map);

      stops.forEach((stop, index) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className =
          markerStyle === "dot" ? "oddway-pin" : "oddway-marker";
        if (markerStyle === "numbered") {
          element.textContent = String(index + 1);
        }
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

        content.append(heading, place);

        // Only meaningful once a route exists to be detouring from.
        if (stop.detourMinutes !== undefined && stop.detourMinutes > 0) {
          const detour = document.createElement("p");
          detour.className = "oddway-popup-meta";
          detour.textContent = formatDetour(stop.detourMinutes);
          content.append(detour);
        }

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

      frameStops(maplibregl, map, stops, route);
    }

    void plot();

    return () => {
      cancelled = true;
    };
  }, [stops, route, status, markerStyle]);

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

/**
 * Above this many stops the overview map switches from DOM markers to a
 * clustered layer. Comfortably above any single route's results, and well
 * below the point where a thousand elements makes panning stutter.
 */
const CLUSTER_ABOVE = 60;

const CLUSTER_SOURCE = "oddway-stops";
const CLUSTER_LAYERS = [
  "oddway-clusters",
  "oddway-cluster-count",
  "oddway-stop-points",
];

/*
  Handlers are kept so they can be detached again. MapLibre's `on` stacks
  listeners, so replotting without removing the old ones means a click fires
  once per plot — three popups on the third redraw.
*/
type Attached = { layer: string; type: string; handler: (e: never) => void };
let clusterHandlers: Attached[] = [];

function removeClusterLayers(map: MapLibreMap) {
  for (const { layer, type, handler } of clusterHandlers) {
    map.off(type as never, layer, handler as never);
  }
  clusterHandlers = [];

  for (const id of CLUSTER_LAYERS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(CLUSTER_SOURCE)) map.removeSource(CLUSTER_SOURCE);
}

/**
 * Draws every stop as a clustered point layer.
 *
 * Colours are read from the stylesheet rather than written here, so the map
 * cannot drift away from the rest of the site when the palette changes.
 */
function plotClusters(
  maplibregl: typeof import("maplibre-gl"),
  map: MapLibreMap,
  stops: MapStop[],
) {
  const styles = getComputedStyle(document.documentElement);
  const route = styles.getPropertyValue("--color-route").trim() || "#7d5f0e";
  const paper = styles.getPropertyValue("--color-paper").trim() || "#e9e5da";

  removeClusterLayers(map);

  map.addSource(CLUSTER_SOURCE, {
    type: "geojson",
    cluster: true,
    clusterRadius: 44,
    /*
      Past this zoom a cluster breaks into its individual stops.
      Deliberately low: once you are looking at a region rather than the
      country, the pins are the useful thing.
    */
    clusterMaxZoom: 9,
    /*
      A circle marked "2" tells you nothing a pair of pins would not tell you
      better, and it costs a click to open. Below this many stops the cluster
      is not worth its own existence, so the points are drawn directly.
    */
    clusterMinPoints: 25,
    data: {
      type: "FeatureCollection",
      features: stops.map((stop) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [stop.longitude, stop.latitude],
        },
        properties: {
          slug: stop.slug,
          name: stop.name,
          category: stop.category,
          city: stop.city,
          state: stop.state,
          detourMinutes: stop.detourMinutes ?? null,
        },
      })),
    },
  });

  map.addLayer({
    id: "oddway-clusters",
    type: "circle",
    source: CLUSTER_SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": route,
      "circle-opacity": 0.85,
      /*
        Grows with the count, but slowly. A cluster of four hundred should read
        as busier than one of forty without swallowing the map.
      */
      "circle-radius": [
        "interpolate", ["linear"], ["get", "point_count"],
        25, 18, 100, 24, 400, 32,
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": paper,
    },
  });

  map.addLayer({
    id: "oddway-cluster-count",
    type: "symbol",
    source: CLUSTER_SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 13,
      "text-font": ["Noto Sans Regular"],
    },
    paint: { "text-color": paper },
  });

  map.addLayer({
    id: "oddway-stop-points",
    type: "circle",
    source: CLUSTER_SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": route,
      "circle-radius": 7,
      "circle-stroke-width": 2,
      "circle-stroke-color": paper,
    },
  });

  // Clicking a cluster zooms in far enough to break it apart.
  const zoomIntoCluster = (event: maplibregl.MapMouseEvent) => {
    const feature = map.queryRenderedFeatures(event.point, {
      layers: ["oddway-clusters"],
    })[0];
    if (!feature) return;
    const [lng, lat] = (
      feature.geometry as unknown as { coordinates: [number, number] }
    ).coordinates;
    map.easeTo({ center: [lng, lat], zoom: map.getZoom() + 2.5 });
  };
  map.on("click", "oddway-clusters", zoomIntoCluster as never);
  clusterHandlers.push({
    layer: "oddway-clusters",
    type: "click",
    handler: zoomIntoCluster as never,
  });

  /*
    Individual points need a popup of their own. The DOM markers carried one
    each; a circle in a GPU layer is not an element and has nothing attached,
    so without this the pins are visible and inert.
  */
  const openPopup = (event: maplibregl.MapMouseEvent) => {
    const feature = map.queryRenderedFeatures(event.point, {
      layers: ["oddway-stop-points"],
    })[0];
    if (!feature) return;

    const props = feature.properties as {
      name: string;
      category: string;
      city: string;
      state: string;
      detourMinutes: number | null;
    };

    // Built as nodes rather than an HTML string, so a description from the
    // database can never inject markup.
    const content = document.createElement("div");
    content.className = "oddway-popup";

    const heading = document.createElement("p");
    heading.className = "oddway-popup-name";
    heading.textContent = props.name;

    const place = document.createElement("p");
    place.className = "oddway-popup-meta";
    place.textContent = `${categoryLabel(props.category as never)} · ${props.city}, ${props.state}`;

    content.append(heading, place);

    if (props.detourMinutes !== null && props.detourMinutes > 0) {
      const detour = document.createElement("p");
      detour.className = "oddway-popup-meta";
      detour.textContent = formatDetour(props.detourMinutes);
      content.append(detour);
    }

    const [lng, lat] = (
      feature.geometry as unknown as { coordinates: [number, number] }
    ).coordinates;

    new maplibregl.Popup({ offset: 14, closeButton: true, maxWidth: "260px" })
      .setLngLat([lng, lat])
      .setDOMContent(content)
      .addTo(map);
  };

  map.on("click", "oddway-stop-points", openPopup as never);
  clusterHandlers.push({
    layer: "oddway-stop-points",
    type: "click",
    handler: openPopup as never,
  });

  for (const id of ["oddway-clusters", "oddway-stop-points"]) {
    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("mouseenter", id, enter);
    map.on("mouseleave", id, leave);
    clusterHandlers.push({ layer: id, type: "mouseenter", handler: enter });
    clusterHandlers.push({ layer: id, type: "mouseleave", handler: leave });
  }
}

/** Frames the stops when there is no route to frame instead. */
function frameStops(
  maplibregl: typeof import("maplibre-gl"),
  map: MapLibreMap,
  stops: MapStop[],
  route: unknown,
) {
  if (route || stops.length === 0) return;
  const bounds = new maplibregl.LngLatBounds();
  stops.forEach((stop) => bounds.extend([stop.longitude, stop.latitude]));
  map.fitBounds(bounds, {
    padding: FIT_PADDING,
    maxZoom: 9,
    animate: !prefersReducedMotion(),
  });
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
