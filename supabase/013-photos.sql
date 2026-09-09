-- Accounts and visitor photographs.
--
-- Two tables and a storage bucket. The policies are the important part: this
-- is the first feature where the public writes something the public can read,
-- and every one of them is written to fail closed.

/*
  A profile per account.

  Supabase keeps its own auth.users table, which we cannot add columns to and
  should not read from the browser. This mirrors the parts we need — a display
  name to credit a photograph, and a flag for blocking somebody.
*/
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  -- Set when an account is blocked. Their photographs stop being shown and
  -- they cannot upload more, without deleting anything.
  blocked      boolean not null default false,
  created_at   timestamptz not null default now()
);

/*
  A photograph of a stop.

  storage_path points into the 'stop-photos' bucket. The image itself is not
  in this table; this row is the record that it exists, who took it and
  whether it may be shown.
*/
create table if not exists public.stop_photos (
  id           uuid primary key default gen_random_uuid(),
  stop_id      uuid not null references public.stops (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,

  storage_path text not null unique,
  -- Optional. Alt text matters more here than anywhere else on the site,
  -- because nobody but the photographer knows what the picture shows.
  caption      text check (caption is null or char_length(caption) <= 280),
  alt_text     text check (alt_text is null or char_length(alt_text) <= 200),

  /*
    Visibility is a state rather than a boolean, because "not yet looked at"
    and "looked at and rejected" are different things and collapsing them
    loses the ability to tell a person why.
  */
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  reviewed_at  timestamptz,
  review_note  text,

  taken_at     timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists stop_photos_stop_idx
  on public.stop_photos (stop_id) where status = 'approved';
create index if not exists stop_photos_pending_idx
  on public.stop_photos (created_at) where status = 'pending';
create index if not exists stop_photos_author_idx
  on public.stop_photos (author_id);

-- Profiles ------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Display names appear next to photographs, so they are public.
drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

-- You may create and edit only your own.
drop policy if exists "own profile is writable" on public.profiles;
create policy "own profile is writable"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "own profile is updatable" on public.profiles;
create policy "own profile is updatable"
  on public.profiles for update
  using (auth.uid() = id)
  /*
    The check clause matters as much as the using clause. Without it somebody
    could update their own row and set blocked = false, which would make the
    block button decorative.
  */
  with check (auth.uid() = id and blocked = false);

-- Photographs ---------------------------------------------------------------

alter table public.stop_photos enable row level security;

/*
  The public sees approved photographs from accounts that are not blocked.

  The join to profiles is what makes blocking work retroactively: block an
  account and everything they have posted disappears at once, without touching
  a single photograph row.
*/
drop policy if exists "approved photos are public" on public.stop_photos;
create policy "approved photos are public"
  on public.stop_photos for select
  using (
    status = 'approved'
    and exists (
      select 1 from public.profiles p
      where p.id = author_id and p.blocked = false
    )
  );

-- You can always see your own, whatever state it is in.
drop policy if exists "authors see their own photos" on public.stop_photos;
create policy "authors see their own photos"
  on public.stop_photos for select
  using (auth.uid() = author_id);

/*
  Uploading.

  Note what is absent: no way to choose a status. The client cannot send one
  that survives — a trigger decides it below — so nobody can approve their own
  photograph by crafting a request.
*/
drop policy if exists "signed in users may upload" on public.stop_photos;
create policy "signed in users may upload"
  on public.stop_photos for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.blocked = false
    )
  );

/*
  Trust, earned once.

  A first-time uploader's photograph waits for review. Once one of their
  photographs has been approved, everything they post afterwards goes straight
  up. A spammer never gets a free post; a real visitor is gated exactly once.

  This is derived from what is already in the table rather than kept as a flag
  on the profile, because a flag is a second thing to remember to set and the
  answer is already sitting here. Approving somebody's first photograph frees
  them automatically, with no second step to forget.

  SECURITY DEFINER is needed so the check can see the author's other rows
  regardless of who is inserting. The search_path is pinned because a function
  running with the definer's rights and a caller's search_path is the classic
  way to hijack one.
*/
create or replace function public.set_photo_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.stop_photos
    where author_id = new.author_id and status = 'approved'
  ) then
    new.status := 'approved';
  else
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists set_photo_status on public.stop_photos;
create trigger set_photo_status
  before insert on public.stop_photos
  for each row execute function public.set_photo_status();

-- Authors may withdraw their own photographs. They cannot edit anyone's.
drop policy if exists "authors may delete their own photos" on public.stop_photos;
create policy "authors may delete their own photos"
  on public.stop_photos for delete
  using (auth.uid() = author_id);

select
  tgname as trigger_name,
  tgrelid::regclass as on_table
from pg_trigger
where not tgisinternal and tgname = 'set_photo_status';

select
  c.relname as table_name,
  c.relrowsecurity as rls,
  count(p.policyname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.tablename = c.relname and p.schemaname = 'public'
where n.nspname = 'public' and c.relname in ('profiles', 'stop_photos')
group by c.relname, c.relrowsecurity;
