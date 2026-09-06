-- museums: 3 places from the OpenStreetMap scan.
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
  ('World''s Largest Toy Museum', 'world-s-largest-toy-museum', 'museums', 36.646433, -93.287465, 'Branson', 'MO', 'A small museum in Branson, MO, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/2702270051', 'America/Chicago'),
  ('Paul Bunyan Logging Camp Museum', 'paul-bunyan-logging-camp-museum', 'museums', 44.810459, -91.517919, 'Eau Claire', 'WI', 'A small museum in Eau Claire, WI, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/way/449480074', 'America/Chicago'),
  ('Paul Bunyan Historical Museum', 'paul-bunyan-historical-museum', 'museums', 47.003669, -94.730578, 'Walker', 'MN', 'A small museum in Walker, MN, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/367068130', 'America/Chicago')
on conflict (slug) do update set
  latitude  = excluded.latitude,
  longitude = excluded.longitude,
  city      = excluded.city,
  state     = excluded.state,
  timezone  = excluded.timezone;
-- Note: description is deliberately not updated here. Re-running this must
-- never overwrite a description somebody has written with the placeholder.
