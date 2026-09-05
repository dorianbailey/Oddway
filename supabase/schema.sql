-- OddWay schema.
--
-- Run this in the Supabase SQL editor, or with the Supabase CLI:
--   supabase db execute --file supabase/schema.sql
--
-- One design note worth reading before changing anything: `detour_minutes` is
-- deliberately NOT a column. How far a stop sits off your route depends on the
-- route, so it is computed per request in lib/corridor.ts. Storing it would
-- mean storing a number that is wrong for every journey but one.

create extension if not exists postgis;

-- Categories match CategorySlug in types/oddway.ts. Adding one means changing
-- both, which is intentional friction: the UI needs a label for every value.
do $$ begin
  create type public.stop_category as enum (
    'cryptids',
    'folklore',
    'haunted',
    'ufos',
    'weird-history',
    'museums',
    'roadside-oddities'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.public_access as enum (
    'open',
    'limited',
    'roadside',
    'private'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.stops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  category    public.stop_category not null,

  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),

  -- Derived from lat/lng so the two can never drift apart. Used by the GIST
  -- index below, and by any future radius or nearest-neighbour queries.
  geom geography(Point, 4326)
    generated always as (
      st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    ) stored,

  city        text not null,
  state       text not null check (char_length(state) = 2),
  description text not null,

  public_access public.public_access not null default 'open',
  image       text,

  -- Where the entry came from. Nullable while an entry is unverified, but
  -- nothing should reach users without one.
  source      text,
  verified_at timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The corridor query filters by bounding box first, so these carry the load.
create index if not exists stops_geom_idx on public.stops using gist (geom);
create index if not exists stops_category_idx on public.stops (category);
create index if not exists stops_latlng_idx on public.stops (latitude, longitude);

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stops_touch_updated_at on public.stops;
create trigger stops_touch_updated_at
  before update on public.stops
  for each row execute function public.touch_updated_at();

-- Row Level Security.
--
-- The index is public data, so anonymous reads are allowed. No insert, update
-- or delete policy exists, which means writes are only possible with the
-- service role key — and that key must never leave the server.
alter table public.stops enable row level security;

drop policy if exists "Stops are publicly readable" on public.stops;
create policy "Stops are publicly readable"
  on public.stops
  for select
  to anon, authenticated
  using (true);
