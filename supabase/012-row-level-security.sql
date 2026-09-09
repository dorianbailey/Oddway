-- Row level security. This closes a real hole.
--
-- Supabase's advisor flagged public.spatial_ref_sys as critical. That one is
-- noise: it is PostGIS's table of coordinate system definitions, it holds no
-- data of ours, the EPSG codes in it are published publicly anyway, and the
-- extension owns it so RLS cannot be enabled on it without superuser rights.
--
-- The actual problem was not flagged. RLS was off on our own tables, which
-- meant the anon key — which ships inside the public JavaScript bundle and is
-- readable by anyone who opens the page source — could write to them. A DELETE
-- against public.stops with that key was accepted. Anybody could have emptied
-- the index, and nothing would have stopped them or told us.
--
-- Reading the suggestions table was open too, so anything a visitor submitted
-- through the form, including whatever they put in a message, was public.
--
-- What the site genuinely needs with the anon key:
--   stops         read
--   events        read
--   suggestions   insert only — writing a suggestion, never reading one
--   geocode_cache read and write, because the route caches lookups
--
-- Everything else is denied. Enabling RLS with no policy denies by default,
-- so each permission below is deliberate.

-- Stops: the public index. Read by everyone, written by nobody with this key.
alter table public.stops enable row level security;

drop policy if exists "stops are publicly readable" on public.stops;
create policy "stops are publicly readable"
  on public.stops for select
  using (true);

-- Events: same.
alter table public.events enable row level security;

drop policy if exists "events are publicly readable" on public.events;
create policy "events are publicly readable"
  on public.events for select
  using (true);

/*
  Suggestions: a post box, not a noticeboard.

  Insert is allowed because the form needs it. Select is deliberately absent —
  somebody reporting a wrong entry may include their name or email, and that
  belongs to them. Read them from the dashboard, where you are authenticated.
*/
alter table public.suggestions enable row level security;

drop policy if exists "anyone may submit a suggestion" on public.suggestions;
create policy "anyone may submit a suggestion"
  on public.suggestions for insert
  with check (true);

/*
  Geocode cache: place names to coordinates, which is public information that
  anyone could look up themselves.

  Read and write are both needed because the geocoding route caches its
  results. This is the weakest policy here: someone could write junk into the
  cache and send a traveller to the wrong place. The proper fix is a service
  role key used server-side only, which would let this table deny the anon key
  entirely — worth doing, and noted in the README rather than left implicit.
*/
alter table public.geocode_cache enable row level security;

drop policy if exists "geocode cache is readable" on public.geocode_cache;
create policy "geocode cache is readable"
  on public.geocode_cache for select
  using (true);

drop policy if exists "geocode cache is writable" on public.geocode_cache;
create policy "geocode cache is writable"
  on public.geocode_cache for insert
  with check (true);

drop policy if exists "geocode cache is updatable" on public.geocode_cache;
create policy "geocode cache is updatable"
  on public.geocode_cache for update
  using (true);

-- What the anon role can now do, table by table.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  coalesce(string_agg(p.cmd::text, ', ' order by p.cmd::text), 'none') as anon_can
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.tablename = c.relname and p.schemaname = 'public'
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('stops', 'events', 'suggestions', 'geocode_cache')
group by c.relname, c.relrowsecurity
order by c.relname;
