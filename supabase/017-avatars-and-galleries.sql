-- Profile pictures, and public galleries.

alter table public.profiles
  add column if not exists avatar_path text;

/*
  A profile picture skips review, deliberately.

  A photograph attached to a stop is content the index publishes and stands
  behind; an avatar is somebody's own thumbnail, shown at a size where it
  carries almost nothing. Gating those would mean a person cannot look like
  themselves until somebody gets round to it, for very little gained.

  The safeguard is removal rather than approval: an administrator can clear
  anyone's avatar, and blocking an account hides everything they have posted.
*/
drop policy if exists "own profile avatar is updatable" on public.profiles;
create policy "own profile avatar is updatable"
  on public.profiles for update
  using (auth.uid() = id)
  /*
    The display name is deliberately absent from what this permits: the check
    below compares the incoming name against the stored one, so an update that
    changes it fails. Names are set once at signup and this policy does not
    reopen that.

    blocked and is_admin are likewise pinned, so nobody can unblock or promote
    themselves through the avatar endpoint.
  */
  with check (
    auth.uid() = id
    and display_name = (select display_name from public.profiles where id = auth.uid())
    and blocked = false
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
  );

-- Administrators may clear an avatar that should not be there.
drop policy if exists "admins may clear avatars" on public.profiles;
create policy "admins may clear avatars"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin() and is_admin = false);

-- The bucket ---------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB. The browser resizes to 256px first; this is a backstop.
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars go in your own folder" on storage.objects;
create policy "avatars go in your own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.blocked = false
    )
  );

drop policy if exists "you may replace your own avatar" on storage.objects;
create policy "you may replace your own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "you may remove your own avatar" on storage.objects;
create policy "you may remove your own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

select
  (select count(*) from storage.buckets where id = 'avatars') as avatar_bucket,
  (select count(*) from information_schema.columns
    where table_name = 'profiles' and column_name = 'avatar_path') as avatar_column;
