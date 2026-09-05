# OddWay

**Have fun while you travel. Take the OddWay.**

A road-trip discovery platform for finding cryptids, folklore, haunted places,
UFO history, weird history, museums and roadside oddities along a route.

## Status

This is the frontend foundation. The route engine, the interactive map and the
database are not built yet, and nothing in the UI pretends otherwise — there
are no simulated API calls and no invented results anywhere in the app.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript, strict mode
- Tailwind CSS v4 — CSS-first `@theme` tokens, no `tailwind.config.js`
- Self-hosted variable fonts via `next/font/local`
- No runtime dependencies beyond Next and React

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

Copy `.env.example` to `.env.local` when you start wiring services up. No
environment variables are needed today.

## Project layout

```
app/
  layout.tsx        Root layout: metadata, fonts, skip link, header, footer
  page.tsx          Homepage
  globals.css       Design tokens, type scale, custom utilities
  fonts.ts          next/font/local setup
  fonts/            Subset woff2 files
  explore/          Category index
  about/  privacy/  terms/  not-found.tsx
components/         Header, Hero, RouteSearch, CategoryFilters, MapSection,
                    StopCard, HowItWorks, ExploreCategories, Footer, OddWayLogo
lib/
  stops.ts          Data access seam — the only place stop data is read from
  mock-data.ts      Placeholder demo entries
  categories.ts     The seven categories
  format.ts         Detour, access and coordinate formatting
  cx.ts             Class name joiner
types/oddway.ts     Stop, Category, Route, RouteQuery, TripPlan
```

## Design tokens

The palette comes from printed USGS topographic quadrangles and routed National
Park Service signage: pale sheet stock, contour brown, woodland tint, water
blue, and a road-overprint red held back for the route line and primary
actions. All tokens live in the `@theme` block at the top of `app/globals.css`.

Type is Bitter (slab serif) for display and Karla for body, subset to Latin and
served from the app itself. The site makes no third-party requests.

## Database

`lib/stops.ts` is the only place the app reads stop data from. It queries
Supabase when configured and falls back to `lib/mock-data.ts` when it is not,
so the app runs either way and no component knows the difference.

**Setting it up.** Create a Supabase project, then run `supabase/schema.sql`
followed by `supabase/seed.sql` in the SQL editor. Put the project URL and anon
key in `.env.local` (see `.env.example`) and restart. The seed is idempotent —
re-running it updates by slug rather than duplicating.

**Two schema decisions worth knowing.**

`detour_minutes` is not a column. How far a stop sits off your route depends on
the route, so it is computed per request in `lib/corridor.ts`. Storing it would
mean storing a number that is wrong for every journey but one.

Row Level Security is on, with a read-only policy for anonymous users and no
insert, update or delete policy at all. Writes therefore require the service
role key, which stays server-side.

**Corridor queries narrow in Postgres first.** `getStopsNearBounds()` filters
to the route's padded bounding box and applies the category filter in the
query, so Turf only does precise distance-to-line work on a small set. Pulling
the whole table would work at seven rows and fail at seventy thousand. Verified
to return corridor results identical to filtering everything in JavaScript.

## The map

`components/RouteMap.tsx` is the live MapLibre GL map — the only client
component in the map band. `components/MapSection.tsx` stays a server component
and owns the heading, copy and the text fallback.

MapLibre is imported dynamically inside an effect, so it never runs during
server rendering and lands in its own ~980KB chunk rather than the initial
bundle.

**Basemap.** Defaults to OpenFreeMap Positron: OpenStreetMap data, no API key,
no registration, no cookies. Override with `NEXT_PUBLIC_MAP_STYLE_URL`. Free
tile hosts change terms without warning, so `RouteMap` shows an explicit
failure message instead of an empty canvas when the style request fails.

**Route drawing.** `MapSection` and `RouteMap` both accept an optional `route`
prop typed as `Route | null`. Pass one and the map adds a GeoJSON `LineString`
source, draws it in the road red, and fits the viewport to `route.bounds`. With
`route` null — the current state — the map frames the stops instead and says so
in the copy underneath. Nothing needs restructuring when the routing API lands.

**Accessibility.** A WebGL canvas is opaque to assistive technology, so the
`<details>` list under the map is the accessible equivalent, not decoration. It
is server-rendered, so it works with JavaScript disabled and when WebGL is
unavailable. Markers are real `<button>` elements with labels, so they are
reachable by keyboard. Viewport animation is skipped under
`prefers-reduced-motion`.

Turf is still not installed — nothing uses it until detour distances are
computed against a real route line.

## Content policy

Every entry in `lib/mock-data.ts` is placeholder demo data written from
scratch. Nothing is scraped or copied from other travel or location sites. The
places are real but the descriptions, detour estimates and access notes are
unverified and the `source` field is `null` on all of them. Real entries should
carry a populated `source` before anything goes user-facing.
