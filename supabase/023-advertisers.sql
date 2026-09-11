-- Advertising: banners, and later a sponsored place on the map.
--
-- Two products and no more, deliberately:
--   banner      $59/month
--   banner_map  $129/month, the banner plus a marker
--
-- The columns for the map product are here from the start even though nothing
-- reads them yet, because adding a column later to a table Stripe writes to is
-- a migration with a live subscription pointed at it. Empty columns cost
-- nothing; a schema change under a running webhook costs an afternoon.

create type public.ad_plan as enum ('banner', 'banner_map');
create type public.ad_status as enum ('pending', 'active', 'paused', 'cancelled');

create table if not exists public.advertisers (
  id              uuid primary key default gen_random_uuid(),

  business_name   text not null,
  destination_url text not null,
  description     text check (description is null or char_length(description) <= 300),
  /* Path inside the ad-banners bucket. Null until an image is uploaded. */
  banner_path     text,

  -- Who to talk to. Never public; see the view below.
  contact_name    text,
  contact_email   text not null,

  plan            public.ad_plan   not null default 'banner',
  /*
    New advertisers are pending, including after a successful payment. Paying
    buys a slot, not publication — the banner is somebody else's image on our
    pages and it gets looked at first.
  */
  status          public.ad_status not null default 'pending',

  -- The map product. Unused until phase three.
  location_name   text,
  address         text,
  latitude        double precision check (latitude is null or latitude between -90 and 90),
  longitude       double precision check (longitude is null or longitude between -180 and 180),
  map_category    public.stop_category,
  logo_path       text,

  -- Filled by the Stripe webhook. Null while invoicing by hand.
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  /*
    Paid through this date. Somebody who cancels on the third of the month has
    paid for the month, and taking their banner down that afternoon would be
    theft of the difference.
  */
  current_period_end     timestamptz,

  starts_at   date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists advertisers_status_idx
  on public.advertisers (status, plan);

alter table public.advertisers enable row level security;

/*
  Nobody but an administrator touches this table.

  Not even a read. The row holds a contact email, a contact name and, shortly,
  Stripe identifiers — none of which belong on a public API, and all of which
  would be on one the moment a select policy let anonymous callers in. A
  column-level grant would work and is easy to get subtly wrong; refusing the
  table outright and publishing a view is the version that stays correct when
  somebody adds a column later.
*/
create policy "administrators manage advertisers"
  on public.advertisers
  for all
  using (public.is_admin())
  with check (public.is_admin());

/*
  What the site actually renders.

  A view, owned by the definer, so it is readable without opening the table.
  It exposes only what appears on a page, and only rows that are live: active,
  with a banner, and either invoiced by hand (no period end) or paid up.

  Anything not selected here cannot leak, whatever happens to the table.
*/
create or replace view public.active_ads
with (security_invoker = false) as
select
  id,
  business_name,
  destination_url,
  description,
  banner_path,
  plan,
  location_name,
  latitude,
  longitude,
  map_category,
  logo_path
from public.advertisers
where status = 'active'
  and banner_path is not null
  and (current_period_end is null or current_period_end > now());

grant select on public.active_ads to anon, authenticated;

-- The bucket ----------------------------------------------------------------

/*
  Public read, like stop-photos, and for the same reason: these images appear
  on pages anybody can see. Writing is administrators only for now. When
  advertisers upload their own banners in phase two this policy is what
  changes, and it should change deliberately rather than being loose already.
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ad-banners',
  'ad-banners',
  true,
  5242880, -- 5MB. A banner has no business being larger.
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ad banners are publicly readable" on storage.objects;
create policy "ad banners are publicly readable"
  on storage.objects for select
  using (bucket_id = 'ad-banners');

drop policy if exists "administrators upload ad banners" on storage.objects;
create policy "administrators upload ad banners"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ad-banners' and public.is_admin());

drop policy if exists "administrators replace ad banners" on storage.objects;
create policy "administrators replace ad banners"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'ad-banners' and public.is_admin());

drop policy if exists "administrators remove ad banners" on storage.objects;
create policy "administrators remove ad banners"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ad-banners' and public.is_admin());

select
  (select count(*) from storage.buckets where id = 'ad-banners') as bucket_created,
  (select count(*) from public.advertisers) as advertisers;
