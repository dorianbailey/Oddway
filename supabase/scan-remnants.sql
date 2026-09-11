-- The last 29 scan remnants.
--
-- Twenty-two were judged not to be stops at all: map labels with no
-- independent source, closed attractions, and objects that exist but that
-- nobody has ever written about. Two are the same place as a stop already in
-- the index. One turned out to be a landmark the index already holds under its
-- real name. Four are real and now have a source.
--
-- This is the first change in a while that moves the count.
--   7121 - 25 = 7096
--
-- Afterwards, both of these must be true:
--   select count(*) from public.stops;                              -- 7096
--   select count(*) from public.stops where verified_at is null;    -- 0

begin;

-- ------------------------------------------------------------------ keep
/*
  Ashley, Indiana's smiley face water tower was citing atlantaillinois.org —
  a different town in a different state. The same shape as the Wisconsin
  gravity hill that cited an Arkansas page. The town's own site is not a deep
  page, but it is at least the right town; a page about the tower itself would
  be better if one turns up.
*/
update public.stops
set source = 'https://ashley.in.gov/',
    verified_at = now()
where slug = 'smiley-face-water-tower';

/*
  Hawks Nest State Park's overlook. Renamed to what the park calls it, and
  carrying the park name because Virginia holds both lovers-leap-overlook and
  lover-s-leap-overlook already — for two different Virginia overlooks, 139 km
  and 213 km from this one. Without the suffix this update would have
  overwritten the Breaks, Virginia stop and left it looking like a Virginia
  row with West Virginia's content.
*/
update public.stops
set name = 'Lovers Leap Overlook — Hawks Nest',
    slug = 'lovers-leap-overlook-hawks-nest',
    source = 'https://wvstateparks.com/parks/hawks-nest-state-park/trails/',
    verified_at = now()
where slug = 'lover-s-leap-lookout';

/*
  The scan recorded the mascot; the thing you can actually stand next to is an
  eight-foot boot outside the WyoLotto headquarters in Cheyenne, with Yolo on
  it. Named for the object rather than the character painted on it.
*/
update public.stops
set name = 'WyoLotto Big Boot',
    slug = 'wyolotto-big-boot',
    source = 'https://we-news.com/us/wyolotto-unveils-jackalope-themed-big-boot-in-cheyenne-joining-city-s-public-art-trail',
    verified_at = now()
where slug = 'yolo-the-jackalope';

/*
  Centralia is a borough; the reason to go is the mine fire. The name now says
  so, which also frees the slug "centralia" — generic enough that any future
  Centralia would have collided with it.
*/
update public.stops
set name = 'Centralia Mine Fire',
    slug = 'centralia-mine-fire',
    verified_at = now()
where slug = 'centralia';

-- ---------------------------------------------------------------- delete

-- abandoned mine marker: The generic AML page does not identify this marker or any visitor site; the scan never establish
delete from public.stops where slug = 'abandoned-mine-marker';

-- Alien Rock Formation near Cliff Dwellers: Map-only label; no independent source identifies an established rock formation or visitor stop.
delete from public.stops where slug = 'alien';

-- Belcamp (Ghost Town): Only the OpenStreetMap-derived locality record was found; no reliable history or visitor-site so
delete from public.stops where slug = 'belcamp-ghost-town';

-- Sherwood Bigfoot: Map-only roadside or private Bigfoot figure with no acceptable source documenting a public stop.
delete from public.stops where slug = 'bigfoot-2';

-- Chaos Haunted House: Only historical coverage was found; no current operator or 2026 season could be verified.
delete from public.stops where slug = 'chaos-haunted-house';

-- Doctor Morbid's Haunted House: Closed attraction; it should not remain as a current stop.
delete from public.stops where slug = 'doctor-morbid-s-haunted-house';

-- Ghost Town: Generic OpenStreetMap attraction label with no independent source identifying a current public s
delete from public.stops where slug = 'ghost-town';

-- Ghost Town: Map-derived Ghost Town label with no independent source establishing a visitor attraction or ide
delete from public.stops where slug = 'ghost-town-2';

-- Giant Ball Sculpture: Map-derived artwork record only; no reliable source identifies an official title, artist, or est
delete from public.stops where slug = 'giant-ball';

-- Gilbert Ghost Town: The mining settlement is historically plausible, but direct stop-level sources are limited to ma
delete from public.stops where slug = 'gilbert-ghost-town';

-- Haunted Tales: Available coverage is an old sale or directory listing; current operation could not be verified.
delete from public.stops where slug = 'haunted-tales';

-- Hodag Statue, Rhinelander: hodag-statue-and-hodag-store
delete from public.stops where slug = 'hodag';

-- Hook-Up Towing UFO: The city business page verifies Hook Up Towing but does not mention the UFO; no acceptable sourc
delete from public.stops where slug = 'hook-up-towing-ufo';

-- Martin Augustine Mining Camp: The source documents a 1930 photograph of Martin Augustine at a camp, not an established present
delete from public.stops where slug = 'martin-augustine-mining-camp';

-- Neah Bay Big Chair: Map-derived giant-chair record with no acceptable independent source documenting the installatio
delete from public.stops where slug = 'neah-bay-big-chair';

-- Penitentiary Avenue: The scan name was the road; ADOT documents the actual historic stop as the Ocean-to-Ocean Bridge
delete from public.stops where slug = 'penitentiary-avenue';

-- Rt 30 Alien: Map-only roadside figure; no acceptable independent source documents it.
delete from public.stops where slug = 'rt-30-alien';

-- Bloomfield Sasquatch: Map-derived private or roadside figure with no independent source documenting it as a public sto
delete from public.stops where slug = 'sasquatch';

-- Sol Duc Sasquatch: Map-derived Sasquatch figure with no acceptable independent source documenting a public stop.
delete from public.stops where slug = 'sasquatch-2';

-- Spencer´s Mining Camp: ghost-town-pahreah-old-chimney
delete from public.stops where slug = 'spencer-s-mining-camp';

-- The Fear Factory: Historical and local listings show the haunt in prior seasons, but no acceptable current operato
delete from public.stops where slug = 'the-fear-factory';

-- UFO Landing Port: The object is real, but the only stop-specific source found was Roadside America, which the brie
delete from public.stops where slug = 'ufo-landing-port';

-- World's Largest Lobster Trap: The real giant trap appears to be at Friendship Trap Co. in Columbia Falls, not Addison, and no 
delete from public.stops where slug = 'world-s-largest-lobster-trap';

-- worlds largest bluebird: Only map-derived evidence was found, and it places the statue in Woodside Township rather than c
delete from public.stops where slug = 'worlds-largest-bluebird';

-- Worlds Largest Shopping Cart: Map-only oversized-cart record; no acceptable independent source documents a public attraction.
delete from public.stops where slug = 'worlds-largest-shopping-cart';


commit;

select count(*) as total_should_be_7096 from public.stops;
select count(*) as unverified_should_be_0 from public.stops where verified_at is null;
