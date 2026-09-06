-- folklore: 18 places from the OpenStreetMap scan.
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
  ('Expedition Everest: Legend of the Forbidden Mountain', 'expedition-everest-legend-of-the-forbidden-mountain', 'folklore', 28.358611, -81.587202, 'Citrus Ridge', 'FL', 'A piece of local folklore in Citrus Ridge, FL, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/relation/3937134', 'America/New_York'),
  ('The Legend of Bruce Lee Statue', 'the-legend-of-bruce-lee-statue', 'folklore', 34.065116, -118.237433, 'Los Angeles', 'CA', 'A piece of local folklore in Los Angeles, CA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/5322526877', 'America/Los_Angeles'),
  ('Lovers Leap', 'lovers-leap', 'folklore', 36.424372, -105.002916, 'Angel Fire', 'NM', 'A piece of local folklore in Angel Fire, NM, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/357576563', 'America/Denver'),
  ('Lover''s Leap', 'lover-s-leap', 'folklore', 34.684831, -94.363664, 'Mena', 'AR', 'A piece of local folklore in Mena, AR, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/4622612517', 'America/Chicago'),
  ('Gravity Hill - Folklore Destination', 'gravity-hill-folklore-destination', 'folklore', 35.582997, -80.245116, 'Richfield', 'NC', 'A piece of local folklore in Richfield, NC, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/10698447293', 'America/New_York'),
  ('Legend of June Lake Slot Machines', 'legend-of-june-lake-slot-machines', 'folklore', 37.799244, -119.06356, 'Mammoth Lakes', 'CA', 'A piece of local folklore in Mammoth Lakes, CA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/11115109681', 'America/Los_Angeles'),
  ('Bartlesville Gravity Hill', 'bartlesville-gravity-hill', 'folklore', 36.668327, -95.988965, 'Bartlesville', 'OK', 'A piece of local folklore in Bartlesville, OK, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/3268289720', 'America/Chicago'),
  ('Legend of Ondessonk', 'legend-of-ondessonk', 'folklore', 37.517881, -88.754435, 'Vienna', 'IL', 'A piece of local folklore in Vienna, IL, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/12628952961', 'America/Chicago'),
  ('Lover''s Leap Lookout', 'lover-s-leap-lookout', 'folklore', 38.119628, -81.118475, 'Ansted', 'WV', 'A piece of local folklore in Ansted, WV, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/2924140473', 'America/New_York'),
  ('Lover''s Leap Wayside', 'lover-s-leap-wayside', 'folklore', 36.717625, -80.323185, 'Stuart', 'VA', 'A piece of local folklore in Stuart, VA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/3450687553', 'America/New_York'),
  ('Fred Clifton Park Overlook - Lover''s Leap', 'fred-clifton-park-overlook-lover-s-leap', 'folklore', 36.720258, -80.325434, 'Stuart', 'VA', 'A piece of local folklore in Stuart, VA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/3450792962', 'America/New_York'),
  ('Lover''s Leap Overlook', 'lover-s-leap-overlook', 'folklore', 36.701944, -82.743131, 'Gate City', 'VA', 'A piece of local folklore in Gate City, VA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/3694296962', 'America/New_York'),
  ('Lovers Leap Overlook', 'lovers-leap-overlook', 'folklore', 37.281638, -82.288051, 'Grundy', 'VA', 'A piece of local folklore in Grundy, VA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/10674656789', 'America/New_York'),
  ('The Legend of the Iron Hoop', 'the-legend-of-the-iron-hoop', 'folklore', 41.145601, -81.339982, 'Kent', 'OH', 'A piece of local folklore in Kent, OH, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/2434316436', 'America/New_York'),
  ('Legend of Jenny Jump', 'legend-of-jenny-jump', 'folklore', 40.900861, -74.956664, 'Oxford', 'NJ', 'A piece of local folklore in Oxford, NJ, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/2664343141', 'America/New_York'),
  ('Gravity Hill', 'gravity-hill', 'folklore', 42.547073, -90.233213, 'Shullsburg', 'WI', 'A piece of local folklore in Shullsburg, WI, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/1150687242', 'America/Chicago'),
  ('The Legend of John Maynard Memorial', 'the-legend-of-john-maynard-memorial', 'folklore', 42.880979, -78.888742, 'Buffalo', 'NY', 'A piece of local folklore in Buffalo, NY, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/8340924036', 'America/New_York'),
  ('Legend of the Moon', 'legend-of-the-moon', 'folklore', 47.663388, -122.121976, 'Redmond', 'WA', 'A piece of local folklore in Redmond, WA, found in OpenStreetMap. Nobody has written this one up yet, so check the source link and the access details before making a special trip.', 'open', 'https://www.openstreetmap.org/node/10314105826', 'America/Los_Angeles')
on conflict (slug) do update set
  latitude  = excluded.latitude,
  longitude = excluded.longitude,
  city      = excluded.city,
  state     = excluded.state,
  timezone  = excluded.timezone;
-- Note: description is deliberately not updated here. Re-running this must
-- never overwrite a description somebody has written with the placeholder.
