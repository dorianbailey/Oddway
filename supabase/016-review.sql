-- Reviewing photographs, from the site rather than the dashboard.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

/*
  Whether the caller is an administrator.

  This has to be a function rather than a subquery inside the policies, because
  a policy on profiles that reads profiles calls itself: Postgres evaluates the
  policy to answer the query, and the policy needs the query answered. The
  result is infinite recursion and an error on every read.

  SECURITY DEFINER runs the lookup with the owner's rights, which skips row
  level security and breaks the loop. search_path is pinned because a definer
  function that resolves names using the caller's path is the standard way one
  gets hijacked.
*/
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Reviewers see everything, including what is pending and what was rejected.
drop policy if exists "admins see all photos" on public.stop_photos;
create policy "admins see all photos"
  on public.stop_photos for select
  using (public.is_admin());

-- And are the only people who can change a status.
drop policy if exists "admins may review photos" on public.stop_photos;
create policy "admins may review photos"
  on public.stop_photos for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins may remove photos" on public.stop_photos;
create policy "admins may remove photos"
  on public.stop_photos for delete
  using (public.is_admin());

/*
  Blocking an account.

  Note the check clause forbids an administrator setting is_admin, on anyone
  including themselves. Promoting a reviewer is a deliberate act that should
  happen with a hand on the database, not a button somebody can be talked into
  pressing.
*/
drop policy if exists "admins may block accounts" on public.profiles;
create policy "admins may block accounts"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin() and is_admin = false);

/*
  Make the owner's account an administrator.

  Safe to re-run, and safe to have run once with the wrong address: this sets
  the flag on the account named here and clears it everywhere else, so a
  mistaken grant does not linger.
*/
update public.profiles
set is_admin = (
  id = (select id from auth.users where email = 'dorianbailey814@gmail.com' limit 1)
);

select
  p.display_name,
  u.email,
  p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
order by p.is_admin desc, p.created_at;
