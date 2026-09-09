-- Ratings, and the bucket the photographs actually live in.

/*
  A rating out of five, in halves.

  Stored as numeric rather than a float because a half star is exactly 0.5 and
  floating point does not hold that promise — 4.5 stored as a float can come
  back as 4.499999, which then fails a check constraint that looked obviously
  true when it was written.

  The doubling check is the readable way to say "halves only": if twice the
  rating is a whole number, the rating was a multiple of 0.5.
*/
alter table public.stop_photos
  add column if not exists rating numeric(2, 1);

alter table public.stop_photos
  drop constraint if exists stop_photos_rating_check;

alter table public.stop_photos
  add constraint stop_photos_rating_check check (
    rating is null
    or (rating >= 0 and rating <= 5 and (rating * 2) = trunc(rating * 2))
  );

-- The bucket ---------------------------------------------------------------

/*
  Public read, because the photographs appear on pages anybody can see. That is
  safe here only because the row in stop_photos decides whether a photograph is
  shown at all: a rejected or blocked photograph is never rendered, so its URL
  is never published.

  It does mean a person who already has the URL keeps access after a rejection,
  which is the trade for not signing every image on every page load. Worth
  knowing rather than assuming otherwise.
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stop-photos',
  'stop-photos',
  true,
  10485760, -- 10MB, generous: the browser resizes to a few hundred KB first.
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

/*
  Writing is confined to a folder named after the uploader.

  storage.foldername() splits the path; the first segment must equal the
  caller's id. This is why lib/photo-upload.ts builds paths that lead with the
  author id and sanitises everything after it — the shape of that string is
  what this policy checks.
*/
drop policy if exists "stop photos are publicly readable" on storage.objects;
create policy "stop photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'stop-photos');

drop policy if exists "uploads go in your own folder" on storage.objects;
create policy "uploads go in your own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'stop-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.blocked = false
    )
  );

drop policy if exists "you may remove your own uploads" on storage.objects;
create policy "you may remove your own uploads"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stop-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

select
  (select count(*) from storage.buckets where id = 'stop-photos') as bucket_created,
  (select count(*) from pg_policies
    where schemaname = 'storage' and policyname like '%stop photos%'
       or policyname like '%your own%') as storage_policies;
