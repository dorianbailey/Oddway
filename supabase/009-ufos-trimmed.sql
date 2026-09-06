-- The UFO import, trimmed by hand from the 12 rows the scan returned.
--
-- Dropped: Alien Swirling Saucers (Disney), Men in Black: Alien Attack
-- (Universal), Area 51 Laser Tag, and The Peace Bowl — theme park rides and
-- businesses that borrowed the vocabulary.
--
-- Run this rather than the raw import-ufos.sql, which still contains them.

insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description,
   public_access, source, timezone, verified_at)
values
  ('International UFO Museum & Research Center', 'international-ufo-museum-research-center', 'ufos', 33.393705, -104.52322, 'Roswell', 'NM',
   'The centre of the Roswell industry, in a former cinema on Main Street. Founded in 1991 by people connected to the 1947 incident, it holds exhibits, witness affidavits and a research library, and takes the documentary record rather more seriously than the gift shops around it.',
   'open', 'https://www.openstreetmap.org/node/1806341993', 'America/Denver', now()),
  ('UFO Landing Port', 'ufo-landing-port', 'ufos', 44.444383, -87.837378, 'Poland', 'WI',
   'A marked landing pad built for visitors who have not arrived yet, standing by the roadside in rural Wisconsin. Free, always there, and entirely sincere about being a joke.',
   'roadside', 'https://www.openstreetmap.org/node/4530157043', 'America/Chicago', now()),
  ('Rt 30 Alien', 'rt-30-alien', 'ufos', 43.633298, -74.39443, 'Speculator', 'NY',
   'A roadside alien figure on Route 30 in the Adirondacks, the sort of thing that exists purely so people slow down. A quick photograph rather than a destination.',
   'roadside', 'https://www.openstreetmap.org/node/9925313103', 'America/New_York', now()),
  ('Hook-Up Towing UFO', 'hook-up-towing-ufo', 'ufos', 39.856108, -95.5433, 'Hiawatha', 'KS',
   'A flying saucer parked outside a towing company in northeast Kansas — roadside advertising that outgrew its purpose. Visible from the road, but the yard is a working business, so look rather than wander in.',
   'roadside', 'https://www.openstreetmap.org/node/9077872686', 'America/Chicago', now())
on conflict (slug) do update set
  description = excluded.description,
  latitude    = excluded.latitude,
  longitude   = excluded.longitude,
  timezone    = excluded.timezone;
