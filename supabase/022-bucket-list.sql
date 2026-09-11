-- The bucket list: places somebody means to get to one day.
--
-- Separate from the trip, which lives in the browser and is about this
-- weekend. A bucket list is a thing people expect to still have in a year and
-- on a different phone, so it goes in the database behind an account. That is
-- the first thing on OddWay besides photos to need one — the about page and
-- the account page both claim otherwise and will need correcting.
--
-- Nobody sees anybody else's. There is no sharing, no public view and no
-- count displayed anywhere: it is a private list, and the policies below are
-- the only thing standing between that claim and it being untrue.

create table if not exists public.bucket_list (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  stop_id  uuid not null references public.stops (id) on delete cascade,
  added_at timestamptz not null default now(),

  /*
    The pair is the key. A stop is either on your list or it is not — there is
    no meaning to adding it twice, and making that impossible in the schema is
    better than making the button careful.
  */
  primary key (user_id, stop_id)
);

/*
  Every read is "my list", so the index leads with user_id. added_at is in it
  so the list can come back newest-first without a sort.
*/
create index if not exists bucket_list_user_idx
  on public.bucket_list (user_id, added_at desc);

alter table public.bucket_list enable row level security;

/*
  Four policies, all saying the same thing: your rows, nobody else's.

  Written out rather than combined into one `for all` policy because a
  mistake in a single broad policy is a mistake in every operation at once,
  and because the insert case needs `with check` rather than `using` — a
  distinction that is easy to lose when they are merged.
*/

create policy "your bucket list is yours to read"
  on public.bucket_list
  for select
  using (user_id = auth.uid());

create policy "you may add to your own bucket list"
  on public.bucket_list
  for insert
  with check (user_id = auth.uid());

create policy "you may remove from your own bucket list"
  on public.bucket_list
  for delete
  using (user_id = auth.uid());

/*
  No update policy, deliberately. There is nothing on a row worth changing:
  added_at is a record of when, and changing which stop a row points at is
  just a delete and an insert. Leaving update unpolicied means it is denied,
  which is the correct answer.
*/
