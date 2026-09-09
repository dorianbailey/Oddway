-- Administrators can remove a photograph's file as well as its row.
--
-- The stop-photos bucket already let people delete inside their own folder.
-- An administrator is not inside anybody else's folder, so deleting a row
-- succeeded while the image stayed in storage — orphaned, still reachable by
-- anyone holding the URL, and no longer listed anywhere that would let it be
-- found again.
--
-- The avatars bucket got this right in 017; this brings the photograph bucket
-- into line.

drop policy if exists "you may remove your own uploads" on storage.objects;
create policy "you may remove your own uploads"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stop-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
