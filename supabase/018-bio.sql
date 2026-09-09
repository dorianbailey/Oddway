-- A short line about yourself.

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  drop constraint if exists profiles_bio_check;

alter table public.profiles
  add constraint profiles_bio_check check (
    bio is null or char_length(bio) <= 150
  );

/*
  The avatar policy is replaced rather than amended, because it pins every
  column a person must not change and the bio now has to be excluded from that
  list. Leaving the old one in place alongside a new one would mean two
  policies disagreeing about what is editable, and Postgres permits an update
  that satisfies either.
*/
drop policy if exists "own profile avatar is updatable" on public.profiles;
drop policy if exists "own profile is editable" on public.profiles;

create policy "own profile is editable"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Set once at signup, and this is not the way to change it.
    and display_name = (select display_name from public.profiles where id = auth.uid())
    -- Nobody unblocks or promotes themselves through the profile form.
    and blocked = false
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
  );

select column_name, data_type
from information_schema.columns
where table_name = 'profiles' and table_schema = 'public'
order by ordinal_position;
