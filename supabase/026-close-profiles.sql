-- Close the profiles table.
--
-- It was readable by anyone with the anon key, every column: display names and
-- bios, which are meant to be public, but also is_admin and created_at, which
-- are not. Anybody could ask the database which account administers the site,
-- which is the account worth attacking.
--
-- Not a breach — no private data was in there — but it is the reconnaissance
-- step, and it costs nothing to remove.
--
-- Three pieces: a view holding what a photo credit needs, a function for the
-- one check that has to run before anybody is signed in, and a policy that
-- stops the table itself being read by strangers.

begin;

/*
  What is genuinely public about a person here.

  blocked stays, because getPublicProfile already returns it and a blocked
  account's page says so — it is public by design rather than by accident.
  is_admin and created_at go: one names the target, the other is nobody's
  business.

  Owned by the definer, so it is readable without the table being readable.
*/
create or replace view public.public_profiles
with (security_invoker = false) as
select id, display_name, avatar_path, bio, blocked
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

/*
  Signup needs to know whether a display name is taken, and that happens before
  the person has an account — so it cannot be behind an authenticated policy.

  A function returning one boolean rather than a query over the table: it can
  answer "is this taken" without being able to answer "what names exist" or
  "who is the administrator". It also counts blocked accounts as holding their
  name, which a view filtering blocked rows would have got wrong — reporting a
  name as free and then colliding on insert.
*/
create or replace function public.name_taken(candidate text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where display_name ilike btrim(candidate)
  );
$$;

grant execute on function public.name_taken(text) to anon, authenticated;

/*
  And the table itself, closed.

  Your own row stays readable so the account page works, and administrators
  keep full access so the review screens do. Everything public now goes through
  the view above.
*/
drop policy if exists "profiles are publicly readable" on public.profiles;

drop policy if exists "read your own profile" on public.profiles;
create policy "read your own profile"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

commit;

/*
  Afterwards, from the anon key:
    profiles       -> [] or refused
    public_profiles-> display names, no is_admin column at all
    name_taken     -> true or false
*/
select
  (select count(*) from public.public_profiles) as visible_profiles,
  public.name_taken('OddWay Official') as should_be_true,
  public.name_taken('nobody has this name') as should_be_false;
