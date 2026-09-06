-- OddWay import: ufos
-- Generated 2026-09-06T01:33:52.641Z from OpenStreetMap (ODbL).
--
-- READ THIS BEFORE RUNNING IT.
--
-- Descriptions are empty. OSM holds facts, not prose, and inventing
-- descriptions for real places would put unverified claims in front of
-- travellers. Every row lands with verified_at null and its OSM element as the
-- source, so the stop pages already say the entry is unverified.
--
-- 12 rows ready. 18 skipped for missing city or state.

insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description,
   public_access, image, source, opening_hours, website, phone,
   osm_type, osm_id, timezone)
values
  ('Area 51 Laser Tag', 'area-51-laser-tag', 'ufos', 30.287316, -81.411608, 'Jacksonville Beach', 'FL', '', 'open', null, 'https://www.openstreetmap.org/node/4332630760', null, null, null, 'node', 4332630760, 'America/New_York'),
  ('Men in Black: Alien Attack', 'men-in-black-alien-attack', 'ufos', 28.480905, -81.467587, 'Orlando', 'FL', '', 'open', null, 'https://www.openstreetmap.org/node/4694575653', null, null, null, 'node', 4694575653, 'America/New_York'),
  ('Alien Swirling Saucers', 'alien-swirling-saucers', 'ufos', 28.355653, -81.562725, 'Bay Lake', 'FL', '', 'open', null, 'https://www.openstreetmap.org/way/685092734', null, 'https://disneyworld.disney.go.com/attractions/hollywood-studios/alien-swirling-saucers/', null, 'way', 685092734, 'America/New_York'),
  ('International UFO Museum & Research Center', 'international-ufo-museum-research-center', 'ufos', 33.393705, -104.52322, 'Roswell', 'NM', '', 'open', null, 'https://www.openstreetmap.org/way/894384126', 'Mo-Su 09:00-17:00', 'https://roswellufomuseum.com', '+1-575-625-9495', 'way', 894384126, 'America/Denver'),
  ('Flying Saucer', 'flying-saucer', 'ufos', 33.902238, -117.4671, 'Riverside', 'CA', '', 'open', null, 'https://www.openstreetmap.org/way/259294718', null, null, null, 'way', 259294718, 'America/Los_Angeles'),
  ('Alien Museum', 'alien-museum', 'ufos', 35.662973, -105.998555, 'Santa Fe', 'NM', '', 'open', null, 'https://www.openstreetmap.org/node/6760507242', null, null, null, 'node', 6760507242, 'America/Denver'),
  ('Hook-Up Towing UFO', 'hook-up-towing-ufo', 'ufos', 39.856108, -95.5433, 'Hiawatha', 'KS', '', 'open', null, 'https://www.openstreetmap.org/node/7619080563', null, null, null, 'node', 7619080563, 'America/Chicago'),
  ('Flying Saucer', 'flying-saucer-3', 'ufos', 41.451633, -87.718737, 'University Park', 'IL', '', 'open', null, 'https://www.openstreetmap.org/node/6512589565', null, null, null, 'node', 6512589565, 'America/Chicago'),
  ('Pine Bush UFO Museum', 'pine-bush-ufo-museum', 'ufos', 41.609741, -74.301059, 'Pine Bush', 'NY', '', 'open', null, 'https://www.openstreetmap.org/node/8703565078', null, 'https://pinebushmuseum.com/', null, 'node', 8703565078, 'America/New_York'),
  ('UFO Landing Port', 'ufo-landing-port', 'ufos', 44.444383, -87.837378, 'Poland', 'WI', '', 'open', null, 'https://www.openstreetmap.org/node/4661421736', null, null, null, 'node', 4661421736, 'America/Chicago'),
  ('Rt 30 Alien', 'rt-30-alien', 'ufos', 43.633298, -74.39443, 'Village of Speculator', 'NY', '', 'open', null, 'https://www.openstreetmap.org/node/9027241030', null, null, null, 'node', 9027241030, 'America/New_York'),
  ('The Peace Bowl', 'the-peace-bowl', 'ufos', 47.650049, -122.189807, 'Kirkland', 'WA', '', 'open', null, 'https://www.openstreetmap.org/way/1054898031', null, null, null, 'way', 1054898031, 'America/Los_Angeles')
on conflict (slug) do update set
  latitude      = excluded.latitude,
  longitude     = excluded.longitude,
  opening_hours = excluded.opening_hours,
  website       = excluded.website,
  phone         = excluded.phone,
  osm_type      = excluded.osm_type,
  osm_id        = excluded.osm_id,
  timezone      = excluded.timezone,
  osm_synced_at = now();

-- Skipped, no city/state in OSM:
--   Coyote's Flying Saucer Retrieval and Repair Service (32.656178, -116.099248) https://www.openstreetmap.org/node/9333504792
--   Travis Walton's Abduction Site (34.299978, -110.649058) https://www.openstreetmap.org/node/8165782454
--   UFO Experience (33.555006, -111.876563) https://www.openstreetmap.org/node/12910983715
--   Alien Woman (36.270912, -108.226433) https://www.openstreetmap.org/node/1656727357
--   Alien Throne (36.148889, -107.980721) https://www.openstreetmap.org/node/2185892937
--   Flying Saucer (36.207355, -107.608684) https://www.openstreetmap.org/node/5262375317
--   Roswell UFO Monument (33.950189, -105.314113) https://www.openstreetmap.org/node/3832839954
--   UFO Alien Crash Communion Wall (33.612175, -105.194706) https://www.openstreetmap.org/node/5040251063
--   Roswell crash site (1947) (33.950328, -105.313908) https://www.openstreetmap.org/way/379963497
--   Area 51 Alien Center (36.643767, -116.395984) https://www.openstreetmap.org/node/4609365823
--   The Black Mailbox (37.456957, -115.482468) https://www.openstreetmap.org/node/2458096636
--   District 51 (37.268764, -115.80131) https://www.openstreetmap.org/node/4773733662
--   Area 51 Green Pointer (37.401135, -115.49238) https://www.openstreetmap.org/node/12324058915
--   Alien (36.782399, -111.766073) https://www.openstreetmap.org/node/5596600521
--   UFO crash site ( Aztec NM ) (36.878494, -107.841069) https://www.openstreetmap.org/node/5272487533
--   UFO Crash Site Plaque: "Recovery at Hart Canyon" (36.87775, -107.841219) https://www.openstreetmap.org/node/10265208880
--   Landing Zone (47.890874, -122.276852) https://www.openstreetmap.org/node/13281291713
--   UFO (49.343756, -82.159997) https://www.openstreetmap.org/node/8931049317
