-- A shared cache for geocoding lookups.
--
-- The in-memory cache only lives as long as one serverless instance, so on
-- Vercel it is close to useless: every cold start begins with an empty cache
-- and re-asks the provider for "Pittsburgh" all over again.
--
-- Place names do not change. Caching them in Postgres means the same query
-- costs the provider once rather than once per instance, which is the
-- difference between an autocomplete quota that lasts and one that runs out
-- in an afternoon.

create table if not exists public.geocode_cache (
  -- Lowercased query text, and which kind of lookup it was. Forward and
  -- reverse lookups of the same string are different questions.
  query      text not null,
  kind       text not null default 'search' check (kind in ('search', 'autocomplete', 'reverse')),

  -- The provider's answer, stored whole so the shape can change without a
  -- migration. Null means "asked, found nothing" — worth caching too, or a
  -- misspelling gets re-asked forever.
  result     jsonb,

  created_at timestamptz not null default now(),

  primary key (query, kind)
);

create index if not exists geocode_cache_created_idx
  on public.geocode_cache (created_at);

/*
  Read and write allowed for everyone.

  This holds nothing private — place names and coordinates from a public
  gazetteer. Letting the anon role write is what makes it useful, since the
  lookups happen in route handlers that use the anon key. The worst case is
  someone filling it with junk queries, which costs storage and nothing else.
*/
alter table public.geocode_cache enable row level security;

drop policy if exists "Geocode cache is readable" on public.geocode_cache;
create policy "Geocode cache is readable"
  on public.geocode_cache for select to anon, authenticated using (true);

drop policy if exists "Geocode cache is writable" on public.geocode_cache;
create policy "Geocode cache is writable"
  on public.geocode_cache for insert to anon, authenticated with check (true);
