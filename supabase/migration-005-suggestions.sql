-- Suggestions from visitors: corrections, missing places, missing events.
--
-- The most valuable thing this collects is corrections. Hundreds of imported
-- entries are unverified, and the person standing outside a museum that closed
-- two years ago knows something the index does not.

do $$ begin
  create type public.suggestion_kind as enum (
    'correction',   -- something already listed is wrong
    'new_place',
    'new_event',
    'other'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  kind       public.suggestion_kind not null default 'other',

  -- What it is about, when the suggestion came from a specific page.
  stop_slug  text,
  -- Which part of the index the suggestion came from, when it came from a
  -- category heading rather than a specific stop.
  category   text,

  message    text not null check (char_length(message) between 10 and 4000),

  -- Optional, and only used to ask a follow-up question. Nothing is sent
  -- unless someone actually needs clarifying.
  email      text check (email is null or char_length(email) <= 320),

  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists suggestions_created_idx
  on public.suggestions (created_at desc);
create index if not exists suggestions_unhandled_idx
  on public.suggestions (handled) where handled = false;

/*
  Write-only for the public.

  An insert policy with no matching select policy means anyone can leave a
  suggestion and nobody can read them back — including the person who wrote
  one. That matters: suggestions may contain an email address, and a readable
  table would hand every address to anyone with the anon key, which ships in
  the browser bundle by design.

  Reading is done from the Supabase dashboard, or with the service role key.
*/
alter table public.suggestions enable row level security;

drop policy if exists "Anyone may leave a suggestion" on public.suggestions;
create policy "Anyone may leave a suggestion"
  on public.suggestions
  for insert
  to anon, authenticated
  with check (true);
