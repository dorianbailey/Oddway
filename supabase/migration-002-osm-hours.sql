-- Adds OpenStreetMap sourced practical details.
--
-- OSM data is ODbL licensed, which permits storage and reuse with attribution.
-- That is why these can live in our table, unlike Google Places content, whose
-- terms forbid caching anything except place_id and forbid display alongside a
-- non-Google map.
--
-- opening_hours holds the raw OSM tag verbatim. Parsing happens at render time
-- in lib/opening-hours.ts, so a better parser later needs no data migration.

alter table public.stops
  add column if not exists osm_type      text check (osm_type in ('node','way','relation')),
  add column if not exists osm_id        bigint,
  add column if not exists opening_hours text,
  add column if not exists website       text,
  add column if not exists phone         text,
  -- When we last reconciled with OSM. Stale hours are worse than no hours, so
  -- the UI can warn once this gets old.
  add column if not exists osm_synced_at timestamptz;

create index if not exists stops_osm_idx on public.stops (osm_type, osm_id);
