-- OddWay seed data.
--
-- These are the demo entries from lib/mock-data.ts. Every place is real, but
-- the descriptions and access notes are unverified and `source` is null on all
-- of them. Fill in `source` and `verified_at` before anything is shown to
-- users as fact.
--
-- Safe to re-run: conflicting slugs are updated rather than duplicated.

insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description, public_access, image, source)
values
  ('Mothman Museum', 'mothman-museum', 'cryptids', 38.8434, -82.1371, 'Point Pleasant', 'WV', 'Point Pleasant spent thirteen months in 1966 and 1967 reporting a winged figure with red eyes, and it has never really stopped. The museum keeps the newspaper clippings, the witness statements and the props from the film adaptation in one small storefront on Main Street.', 'open', null, null),
  ('Flatwoods Monster Museum', 'flatwoods-monster-museum', 'museums', 38.6651, -80.7059, 'Sutton', 'WV', 'In September 1952 a group of Braxton County kids went up a hill after a light in the sky and came back down describing something ten feet tall in a pleated metal skirt. The collection is small, free and unexpectedly thorough about what the witnesses actually said.', 'open', null, null),
  ('Kecksburg UFO Monument', 'kecksburg-ufo-monument', 'ufos', 40.1834, -79.462, 'Kecksburg', 'PA', 'Something came down in the woods here on a December evening in 1965. Accounts differ on what the military carried out. The fire department settled the matter locally by mounting a large acorn-shaped replica behind the station, which is what most people drive out to see.', 'roadside', null, null),
  ('Trans-Allegheny Lunatic Asylum', 'trans-allegheny-lunatic-asylum', 'haunted', 39.0389, -80.47, 'Weston', 'WV', 'A quarter-mile of hand-cut sandstone, built for 250 patients and holding well over two thousand by the 1950s. Daytime tours cover the architecture and the medical history; the overnight ones cover the reason most people have heard of it.', 'limited', null, null),
  ('Centralia', 'centralia', 'weird-history', 40.804, -76.3405, 'Centralia', 'PA', 'A coal seam under the borough caught fire in 1962 and is still burning. Almost everyone was bought out and moved; the street grid remains, the buildings mostly do not, and steam still works its way up through the ground on cold mornings.', 'roadside', null, null),
  ('Gravity Hill', 'gravity-hill-new-paris', 'folklore', 39.9856, -78.6486, 'New Paris', 'PA', 'Put the car in neutral at the marked spot and it rolls, slowly, in the wrong direction. The surrounding hills hide the true horizon well enough that your eyes lose the argument with the road. Bring a bottle of water to pour out and watch.', 'roadside', null, null),
  ('The Mystery Hole', 'the-mystery-hole', 'roadside-oddities', 38.1339, -81.1043, 'Ansted', 'WV', 'A tilted room where water appears to run uphill and standing straight feels wrong, fronted by a building with a car embedded in it. Open seasonally, cash-friendly, and entirely committed to the bit since 1972.', 'limited', null, null)
on conflict (slug) do update set
  name          = excluded.name,
  category      = excluded.category,
  latitude      = excluded.latitude,
  longitude     = excluded.longitude,
  city          = excluded.city,
  state         = excluded.state,
  description   = excluded.description,
  public_access = excluded.public_access,
  image         = excluded.image,
  source        = excluded.source;

