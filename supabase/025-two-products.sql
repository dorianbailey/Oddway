-- Two products instead of a tier.
--
-- The $129 plan was "the banner, plus a map marker", which made the map
-- something you could only get by buying the banner first. A motel wants the
-- marker and does not care about the banner, and was being asked to pay for
-- both.
--
-- So: banner $59, map $79, bought separately. Somebody who wants both now pays
-- $138 rather than $129, which is a real increase and is deliberate — the
-- bundle was underpriced against its parts. A both-for-less option can be
-- added later without touching this again; the plan list takes new entries.

/*
  Postgres will not drop a value from an enum, so the type is replaced.

  Done in one transaction: a half-applied version of this leaves the column
  pointing at a type that no longer exists, and every read of the table fails
  until somebody notices.
*/
begin;

/*
  The view goes first.

  Postgres refuses to alter a column that a view depends on — it has no way to
  know whether the view's own definition still makes sense afterwards. So the
  view is dropped, the column is changed, and the view is recreated below from
  the same definition. All inside one transaction, so there is never a moment
  where the site could read a half-changed schema.
*/
drop view if exists public.active_ads;

alter type public.ad_plan rename to ad_plan_old;

create type public.ad_plan as enum ('banner', 'map');

/*
  Existing rows on the old bundle become map placements rather than banners.

  They paid $129 for both, and the marker is the part they cannot get any other
  way — dropping them to a banner would take away the more valuable half. They
  keep their banner too, because nothing here deletes banner_path; it simply
  stops being what the plan is called.
*/
alter table public.advertisers
  alter column plan drop default,
  alter column plan type public.ad_plan
    using (
      case plan::text
        when 'banner_map' then 'map'
        else 'banner'
      end
    )::public.ad_plan,
  alter column plan set default 'banner';

drop type public.ad_plan_old;

/*
  And back, identical but for the plan check below.
*/
create view public.active_ads
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
  and (current_period_end is null or current_period_end > now())
  /*
    A banner needs an image; a map placement needs somewhere to be. Neither is
    worth rendering without the thing that makes it visible, and a marker at
    null, null would sit in the Gulf of Guinea.
  */
  and (
    (plan = 'banner' and banner_path is not null)
    or (plan = 'map' and latitude is not null and longitude is not null)
  );

grant select on public.active_ads to anon, authenticated;

commit;

select plan, status, count(*) from public.advertisers group by plan, status;
