-- Adding an advertiser by hand, until the admin screens land.
--
-- Upload the banner first, in the Supabase dashboard:
--   Storage -> ad-banners -> Upload file
-- Then put whatever filename you gave it into banner_path below.
--
-- Leave status as 'pending' to stage one without it appearing, and flip it to
-- 'active' when you are ready. Nothing shows publicly until then.

insert into public.advertisers
  (business_name, destination_url, description, banner_path,
   contact_name, contact_email, plan, status, starts_at)
values
  ('Example Motel',
   'https://example.com/',
   'Twelve rooms on old Route 66, open all year.',
   'example-motel.webp',
   'Pat Example',
   'pat@example.com',
   'banner',
   'pending',
   current_date);

-- Put it live.
-- update public.advertisers set status = 'active', updated_at = now()
-- where business_name = 'Example Motel';

-- What the site would render right now.
select business_name, plan, banner_path from public.active_ads;
