-- Display names are set once, at signup.
--
-- The update policy added with the photos schema let somebody edit their own
-- profile row, and the only editable column on it is display_name. That means
-- a person could rename themselves after their photographs were credited,
-- which is a small feature with a long tail: renames break attribution,
-- confuse anyone who recognised the name, and give a blocked account an easy
-- way to look like somebody new.
--
-- Rather than adding a rule preventing that one column from changing, the
-- policy goes entirely. There is nothing else on a profile a person should be
-- able to edit — 'blocked' is deliberately not theirs — so an update policy
-- with no legitimate use is an opening with no purpose.
--
-- If a bio or an avatar is added later, a policy naming those columns can come
-- back with it.

drop policy if exists "own profile is updatable" on public.profiles;

select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;
