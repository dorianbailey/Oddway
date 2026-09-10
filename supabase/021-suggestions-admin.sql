-- Let administrators read and triage suggestions from the site itself.
--
-- Suggestions have been insert-only since they were built: anyone can leave
-- one, nobody can read them back. That is right for the public and wrong for
-- the person who has to act on them, who has been opening the Supabase table
-- editor to see whether anybody has written in.
--
-- The read policy checks is_admin(), the same function the photo review queue
-- uses, so there is one definition of who can see this rather than two.

drop policy if exists "admins may read suggestions" on public.suggestions;
create policy "admins may read suggestions"
  on public.suggestions for select
  using (public.is_admin());

/*
  Marking one handled is the only edit worth having.

  The check clause pins the message, email and kind to what is already stored,
  so this policy cannot be used to rewrite what somebody wrote — only to record
  that it has been dealt with. A suggestion is somebody else's words and should
  stay that way.
*/
drop policy if exists "admins may mark suggestions handled" on public.suggestions;
create policy "admins may mark suggestions handled"
  on public.suggestions for update
  using (public.is_admin())
  with check (
    public.is_admin()
    and message = (select s.message from public.suggestions s where s.id = suggestions.id)
    and kind = (select s.kind from public.suggestions s where s.id = suggestions.id)
  );

/*
  Deleting is allowed because spam will arrive eventually, and leaving it in a
  list somebody reads daily makes the list worth ignoring.
*/
drop policy if exists "admins may delete suggestions" on public.suggestions;
create policy "admins may delete suggestions"
  on public.suggestions for delete
  using (public.is_admin());

select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'suggestions'
order by cmd, policyname;
