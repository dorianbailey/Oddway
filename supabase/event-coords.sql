-- Event coordinates, from OpenStreetMap place nodes (ODbL).
--
-- Town centres, not venue addresses: festivals move between a fairground,
-- a park and a main street from year to year, and a town centre is honest
-- about that precision. Good enough to answer "how far is this from me".
--
-- Logan, OH was resolved by hand: OSM has two towns called Logan in Ohio
-- and the name lookup returned the one near the Indiana border rather than
-- the Hocking County one the event is in.

update public.events set latitude = 41.2306, longitude = -85.31943, timezone = 'America/Indiana/Indianapolis' where slug = 'beast-of-busco-turtle-days';
update public.events set latitude = 37.7645, longitude = -89.33509, timezone = 'America/Chicago' where slug = 'big-muddy-monster-festival';
update public.events set latitude = 34.53899, longitude = -94.93745, timezone = 'America/Chicago' where slug = 'bigfoot-at-the-40-formerly-honobia-bigfoot-festival-conference';
update public.events set latitude = 40.93958, longitude = -123.63144, timezone = 'America/Los_Angeles' where slug = 'bigfoot-daze';
update public.events set latitude = 37.77422, longitude = -87.11333, timezone = 'America/Chicago' where slug = 'blue-bridge-squatch-fest';
update public.events set latitude = 44.04861, longitude = -73.45974, timezone = 'America/New_York' where slug = 'champ-day';
update public.events set latitude = 34.1351, longitude = -116.31433, timezone = 'America/Los_Angeles' where slug = 'contact-in-the-desert';
update public.events set latitude = 39.08317, longitude = -84.51075, timezone = 'America/New_York' where slug = 'covington-cryptid-block-party';
update public.events set latitude = 37.69395, longitude = -85.85913, timezone = 'America/New_York' where slug = 'cryptid-con';
update public.events set latitude = 40.37719, longitude = -105.52322, timezone = 'America/Denver' where slug = 'estes-park-bigfoot-days';
update public.events set latitude = 38.66417, longitude = -80.70931, timezone = 'America/New_York' where slug = 'flatwoods-monster-festival';
update public.events set latitude = 41.46907, longitude = -79.12337, timezone = 'America/New_York' where slug = 'forest-county-bigfoot-festival';
update public.events set latitude = 33.26115, longitude = -93.8854, timezone = 'America/Chicago' where slug = 'fouke-monster-festival';
update public.events set latitude = 39.26895, longitude = -84.26383, timezone = 'America/New_York' where slug = 'frogman-festival-official';
update public.events set latitude = 34.87815, longitude = -83.40099, timezone = 'America/New_York' where slug = 'georgia-bigfoot-conference';
update public.events set latitude = 43.29906, longitude = -123.09549, timezone = 'America/Los_Angeles' where slug = 'glide-sasquatch-festival';
update public.events set latitude = 39.34092, longitude = -80.01897, timezone = 'America/New_York' where slug = 'grafton-monster-festival';
update public.events set latitude = 29.1872, longitude = -82.14009, timezone = 'America/New_York' where slug = 'great-florida-bigfoot-conference';
update public.events set latitude = 34.87115, longitude = -85.29025, timezone = 'America/New_York' where slug = 'green-eyes-festival';
update public.events set latitude = 39.53987, longitude = -82.40849, timezone = 'America/New_York' where slug = 'hocking-hills-bigfoot-festival';
update public.events set latitude = 32.80485, longitude = -97.44502, timezone = 'America/Chicago' where slug = 'lake-worth-monster-bash';
update public.events set latitude = 39.15235, longitude = -80.03949, timezone = 'America/New_York' where slug = 'lurch-fest';
update public.events set latitude = 38.84453, longitude = -82.13709, timezone = 'America/New_York' where slug = 'mothman-festival';
update public.events set latitude = 36.40008, longitude = -93.73924, timezone = 'America/Chicago' where slug = 'ozark-mountain-ufo-conference';
update public.events set latitude = 33.39433, longitude = -104.52295, timezone = 'America/Denver' where slug = 'roswell-ufo-festival';
update public.events set latitude = 43.74494, longitude = -122.46746, timezone = 'America/Los_Angeles' where slug = 'sasquatch-summer-fest';
update public.events set latitude = 35.67537, longitude = -83.75573, timezone = 'America/New_York' where slug = 'smoky-mountain-bigfoot-festival';
update public.events set latitude = 34.8838, longitude = -82.70697, timezone = 'America/New_York' where slug = 'south-carolina-bigfoot-festival';
update public.events set latitude = 40.32674, longitude = -78.92197, timezone = 'America/New_York' where slug = 'squonkapalooza';
update public.events set latitude = 32.54478, longitude = -94.3661, timezone = 'America/Chicago' where slug = 'texas-bigfoot-film-festival';
update public.events set latitude = 36.16239, longitude = -85.49971, timezone = 'America/Chicago' where slug = 'upper-cumberland-bigfoot-festival';
update public.events set latitude = 39.4849, longitude = -80.14265, timezone = 'America/New_York' where slug = 'veggie-man-day';
update public.events set latitude = 38.66417, longitude = -80.70931, timezone = 'America/New_York' where slug = 'west-virginia-bigfoot-festival';
update public.events set latitude = 46.60156, longitude = -120.51084, timezone = 'America/Los_Angeles' where slug = 'yakima-valley-bigfoot-con';
