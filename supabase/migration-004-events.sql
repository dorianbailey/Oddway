-- Events: cryptid, UFO and paranormal festivals.
--
-- A separate table from `stops` rather than another category of it. A stop is
-- a place that is simply there; an event has dates, and most of these recur
-- annually. Folding dates into `stops` would put an "is this a place or an
-- occurrence" branch into every query in the app.

do $$ begin
  create type public.event_category as enum ('cryptid', 'ufo', 'paranormal');
exception when duplicate_object then null;
end $$;

/*
  Whether the date is known or inferred.

  Roughly half of these were derived from prior-year patterns rather than an
  announcement — "historically a September event", "based on 2025 timing". A
  site that renders those identically to a confirmed date will eventually send
  somebody on a four-hour drive to an empty field. This column exists so the
  interface can tell the truth about what it knows.
*/
do $$ begin
  create type public.date_confidence as enum ('confirmed', 'estimated');
exception when duplicate_object then null;
end $$;

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,

  city        text not null,
  state       text not null check (char_length(state) = 2),

  -- Filled by a later geocoding pass. Distance-from-you needs these; the
  -- alphabetical and by-state listings do not, so they stay nullable.
  latitude    double precision check (latitude between -90 and 90),
  longitude   double precision check (longitude between -180 and 180),
  timezone    text,

  category    public.event_category not null default 'cryptid',

  -- First day. Combined with `days` this gives the full run, which is what
  -- decides whether an event has passed.
  start_date  date,
  days        integer not null default 1 check (days between 1 and 31),

  -- How the organisers phrase it: "October 2-4, 2026 (confirmed pattern)".
  -- Kept verbatim because "the first weekend of October" carries information
  -- a single date cannot.
  display_date    text,
  date_confidence public.date_confidence not null default 'estimated',

  description text,
  website     text,
  contact     text,
  -- Provenance and caveats, verbatim from research.
  notes       text,

  verified_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists events_start_date_idx on public.events (start_date);
create index if not exists events_state_idx on public.events (state);
create index if not exists events_category_idx on public.events (category);

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

-- Same posture as stops: public read, writes only via the service role.
alter table public.events enable row level security;

drop policy if exists "Events are publicly readable" on public.events;
create policy "Events are publicly readable"
  on public.events
  for select
  to anon, authenticated
  using (true);
