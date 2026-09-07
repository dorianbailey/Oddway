-- ufos: 29 places from the OpenStreetMap scan.
--
-- Reviewed as a CSV before generation, so anything unwanted was deleted there
-- rather than pruned out of live data afterwards.
--
-- Descriptions are null and verified_at is unset: these pages will say the
-- entry is unverified until somebody writes one, which is honest and is the
-- same discipline the rest of the index follows.

insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description,
   public_access, source, timezone)
values
('International UFO Museum & Research Center', 'international-ufo-museum-research-center', 'ufos', 33.393705, -104.52322, 'Roswell', 'NM', 'A UFO site in Roswell, NM, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/way/894384126', 'America/Denver'),
('Travis Walton''s Abduction Site', 'travis-walton-s-abduction-site', 'ufos', 34.299978, -110.649058, 'Heber-Overgaard', 'AZ', 'A UFO site in Heber-Overgaard, AZ, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/8165782454', 'America/Phoenix'),
('UFO Experience', 'ufo-experience', 'ufos', 33.555006, -111.876563, 'Scottsdale', 'AZ', 'A UFO site in Scottsdale, AZ, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/12910983715', 'America/Phoenix'),
('Alien Woman', 'alien-woman', 'ufos', 36.270912, -108.226433, 'West Hammond', 'NM', 'A UFO site in West Hammond, NM, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/1656727357', 'America/Denver'),
('Alien Museum', 'alien-museum', 'ufos', 35.662973, -105.998555, 'Santa Fe', 'NM', 'A UFO site in Santa Fe, NM, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/6760507242', 'America/Denver'),
('Roswell crash site (1947)', 'roswell-crash-site-1947', 'ufos', 33.950328, -105.313908, 'Capitan', 'NM', 'A UFO site in Capitan, NM, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/way/379963497', 'America/Denver'),
('Area 51 Alien Center', 'area-51-alien-center', 'ufos', 36.643767, -116.395984, 'Beatty', 'NV', 'A UFO site in Beatty, NV, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/4609365823', 'America/Los_Angeles'),
('The Black Mailbox', 'the-black-mailbox', 'ufos', 37.457061, -115.482604, 'Alamo', 'NV', 'A UFO site in Alamo, NV, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/2458096636', 'America/Los_Angeles'),
('Area 51 Back Gate', 'area-51-back-gate', 'ufos', 37.594035, -115.898805, 'Alamo', 'NV', 'A UFO site in Alamo, NV, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/8554608198', 'America/Los_Angeles'),
('Alien', 'alien', 'ufos', 36.782399, -111.766073, 'LeChee', 'AZ', 'A UFO site in LeChee, AZ, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/5596600521', 'America/Denver'),
('UFO crash site ( Aztec NM )', 'ufo-crash-site-aztec-nm', 'ufos', 36.878494, -107.841069, 'Aztec', 'NM', 'A UFO site in Aztec, NM, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/5272487533', 'America/Denver'),
('Hook-Up Towing UFO', 'hook-up-towing-ufo', 'ufos', 39.856108, -95.5433, 'Hiawatha', 'KS', 'A UFO site in Hiawatha, KS, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/7619080563', 'America/Chicago'),
('Rt 30 Alien', 'rt-30-alien', 'ufos', 43.633298, -74.39443, 'Lake Pleasant', 'NY', 'A UFO site in Lake Pleasant, NY, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/9027241030', 'America/New_York'),
('Landing Zone', 'landing-zone', 'ufos', 47.890874, -122.276852, 'Lake Stickney', 'WA', 'A UFO site in Lake Stickney, WA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/13281291713', 'America/Los_Angeles')
on conflict (slug) do update set
  latitude  = excluded.latitude,
  longitude = excluded.longitude,
  city      = excluded.city,
  state     = excluded.state,
  timezone  = excluded.timezone;
-- Note: description is deliberately not updated here. Re-running this must
-- never overwrite a description somebody has written with the placeholder.
