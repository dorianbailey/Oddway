-- Descriptions for the imported cryptid entries.
--
-- Researched by hand with a source for each. Entries where the research was
-- inconclusive keep verified_at null, so their pages continue to say the entry
-- is unverified rather than implying a check that did not happen.

-- The enum had no way to say "this place is gone". Without it a closed museum
-- renders as "Open to visitors", which is the worst possible wrong answer.
alter type public.public_access add value if not exists 'closed';

commit;

-- CALIFORNIA ---------------------------------------------------------------

update public.stops set
  name = 'Bigfoot Discovery Museum',
  description = 'A small roadside museum founded by longtime Bigfoot researcher Michael Rugg, holding footprint casts, local sighting reports, memorabilia and material relating to the Patterson-Gimlin film. Reported permanently closed — check before making the drive.',
  public_access = 'closed',
  source = 'https://www.roadsideamerica.com/story/17314',
  verified_at = now()
where slug = 'bigfoot-museum';

update public.stops set
  description = 'A Bigfoot-themed roadside artwork in Willow Creek, California''s self-proclaimed Bigfoot Country. A quick photo stop near the centre of town and the Willow Creek-China Flat Museum rather than a full attraction.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N13531160722',
  verified_at = now()
where slug = 'gonzalez-bigfoot-statue';

update public.stops set
  description = 'A seasonal local-history museum holding one of the area''s most important Bigfoot collections: footprint casts, photographs, historical documents and material from researcher Bob Titmus. It sits a short distance from Bluff Creek, where the Patterson-Gimlin film was shot in 1967.',
  public_access = 'limited',
  website = 'https://www.thebigfootmuseum.com/',
  source = 'https://www.thebigfootmuseum.com/',
  verified_at = now()
where slug = 'willow-creek-china-flat-museum-bigfoot-collection';

update public.stops set
  description = 'A standalone Bigfoot sculpture near Tonkin Park, one of several Sasquatch photo stops in the town that calls itself the Bigfoot Capital of the World. A roadside artwork rather than a staffed attraction.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N13526912734',
  verified_at = now()
where slug = 'bigfoot-statue';

update public.stops set
  description = 'An outdoor Bigfoot statue at the Community Commons, alongside the Willow Creek-China Flat Museum and the visitor information point. Another easy photo stop while working through the town''s Bigfoot landmarks.',
  public_access = 'roadside',
  source = 'https://www.willowcreekcsd.com/community-commons/',
  verified_at = now()
where slug = 'museum-bigfoot-statue';

-- COLORADO -----------------------------------------------------------------

update public.stops set
  description = 'A Bigfoot-themed shop and visitor attraction in Bailey, home to the Sasquatch Encounter Discovery Museum. Exhibits cover sightings, evidence, research and Colorado''s own Sasquatch stories, with a substantial gift shop attached.',
  public_access = 'open',
  source = 'https://www.colorado.com/bailey/attractions-entertainment/museums/sasquatch-outpost',
  verified_at = now()
where slug = 'sasquatch-outpost';

-- FLORIDA ------------------------------------------------------------------

update public.stops set
  name = 'Skunk Ape Research Headquarters',
  description = 'An Everglades stop devoted to Florida''s Skunk Ape, the swamp-dwelling cryptid often called the Southeast''s Bigfoot. Based at Trail Lakes Campground, it collects sighting reports, lore and research alongside a well-stocked gift counter.',
  public_access = 'open',
  website = 'https://www.skunkape.info/',
  source = 'https://www.skunkape.info/',
  verified_at = now()
where slug = 'skunk-ape-center-and-museum';

-- GEORGIA ------------------------------------------------------------------

update public.stops set
  name = 'Expedition: Bigfoot! The Sasquatch Museum',
  description = 'Four thousand square feet given over entirely to Bigfoot: footprint casts, artifacts, life-size exhibits, sighting maps, photographs, a theatre, a reference library and a research vehicle. One of the most substantial dedicated Bigfoot attractions in the Southeast.',
  public_access = 'open',
  source = 'https://exploregeorgia.org/cherry-log/arts-culture/museums/expedition-bigfoot',
  verified_at = now()
where slug = 'expedition-bigfoot-the-sasquatch-museum';

-- KENTUCKY -----------------------------------------------------------------

update public.stops set
  description = 'A roadside Sasquatch photo opportunity near Kentucky Lake and Grand Rivers. A pose-and-go cryptid stop rather than a museum.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N12893412684',
  verified_at = now()
where slug = 'sasquatch-photo-opp';

-- MICHIGAN -----------------------------------------------------------------
-- Left unverified: published information about the piece is thin and access is
-- unconfirmed.

update public.stops set
  name = 'Sasquatch Artwork',
  description = 'A Sasquatch artwork in Bloomfield Township, near the historic Franklin Cider Mill. Little is published about the piece itself, so treat it as a small local artwork rather than a destination, and check access before going out of your way.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N12664732006'
where slug = 'sasquatch';

-- NEW JERSEY ---------------------------------------------------------------

update public.stops set
  name = 'Jersey Devil Coaster',
  description = 'A single-rail roller coaster at Six Flags Great Adventure themed on the Pine Barrens legend: 130 feet, an 87-degree drop and three inversions. Park admission is required, so this is a day out rather than a roadside stop.',
  public_access = 'limited',
  website = 'https://www.sixflags.com/greatadventure/attractions/jersey-devil-coaster',
  source = 'https://www.sixflags.com/greatadventure/attractions/jersey-devil-coaster',
  verified_at = now()
where slug = 'jersey-devil';

-- OREGON -------------------------------------------------------------------

update public.stops set
  description = 'A Bigfoot museum, gift shop and roadside attraction with footprint casts, alleged hair samples, regional sighting accounts and a large Bigfoot statue outside. Yeti''s Ice Cream & Treats is attached.',
  public_access = 'open',
  source = 'https://sobfe.com/',
  verified_at = now()
where slug = 'southern-oregon-bigfoot-experience';

update public.stops set
  city = 'Boring',
  description = 'A museum and research centre founded by Bigfoot researcher Cliff Barackman, with footprint casts, historical artifacts, films and a life-size Sasquatch. The gift shop and information area are free; the exhibit halls charge admission.',
  public_access = 'open',
  source = 'https://traveloregon.com/things-to-do/oregon-attractions/museums/north-american-bigfoot-center/',
  verified_at = now()
where slug = 'north-american-bigfoot-center';

update public.stops set
  description = 'A genuine wooden trap, built in 1974 by the North American Wildlife Research Team after reports of enormous human-like tracks. Long since disarmed, it sits on the Collings Mountain Trail in Rogue River-Siskiyou National Forest, about three quarters of a mile from the trailhead — you walk in.',
  public_access = 'open',
  source = 'https://www.fs.usda.gov/media/162817',
  verified_at = now()
where slug = 'bigfoot-trap';

update public.stops set
  name = 'Surfing Sasquatch',
  description = 'A hand-carved wooden Sasquatch riding a surfboard, which is exactly right for the Oregon Coast. It stands at the Surfland Hotel — hotel property rather than a public park, so be considerate about photographs.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N13021851179',
  verified_at = now()
where slug = 'surfing-sasquatch';

-- Left unverified: the statue, its artist and the property are all unconfirmed.
update public.stops set
  description = 'A Bigfoot figure mapped in Sherwood. Very little is published about it and access is unconfirmed, so treat this as a lead rather than a destination.',
  source = 'https://www.openstreetmap.org/node/13670202967'
where slug = 'bigfoot-2';

-- WASHINGTON ---------------------------------------------------------------

update public.stops set
  description = 'A 3,500-pound concrete Sasquatch, six foot eight, standing downtown near the Welcome Center. Installed as a town landmark and free to visit at any hour.',
  public_access = 'roadside',
  source = 'https://blainebythesea.com/sasquatch-statue/',
  verified_at = now()
where slug = 'sasquatch-statue';

update public.stops set
  description = 'A mural by Loc Hong at 532 5th Street, showing a Yeti taking a shower aboard a ferry against a backdrop of mountains — Pacific Northwest ferry culture crossed with cryptid humour. Visible from the street.',
  public_access = 'roadside',
  source = 'https://streetartcities.com/cities/seattle/markers/d3d8e61a-825e-4173-945e-4142ef7f5103',
  verified_at = now()
where slug = 'ferry-fever';

update public.stops set
  name = 'Mission Ridge Yeti',
  city = 'Wenatchee',
  description = 'An eleven-foot metal Yeti high on Mission Ridge near the Liberator Express chairlift, welded from steel, recycled tire chains and scrap. The chain "fur" was designed to catch snow and frost. Reaching it means getting up the mountain, so this is a ski-area visit rather than a roadside stop.',
  public_access = 'limited',
  source = 'https://www.visitwenatchee.org/blog/behind-the-mission-ridge-yeti-three-years-later',
  verified_at = now()
where slug = 'the-yeti';

-- Left unverified: ownership and public access are unclear.
update public.stops set
  name = 'Sasquatch Artwork',
  description = 'A Sasquatch artwork in the forests of Clallam County near Forks, mapped close to the Sol Duc River Bar access area. Details about the piece and its ownership are scarce, so confirm access before relying on it.',
  source = 'https://mapcarta.com/N7316891219'
where slug = 'sasquatch-2';

update public.stops set
  name = 'Front Yard Chainsaw Bigfoot',
  description = 'A twelve-foot Bigfoot carved from an evergreen stump by chainsaw artist Patrick Bryson in 2023, holding the house number. It stands in the front garden of a private home — view it from the road and do not enter the property.',
  public_access = 'private',
  source = 'https://www.roadsideamerica.com/tip/79870',
  verified_at = now()
where slug = 'bigfoot';

update public.stops set
  description = 'Richard Beyer''s 1982 sculpture at University Playground: a full-size aluminium Sasquatch leaning into a brightly painted house frame and apparently pushing it over. Free and always there.',
  public_access = 'open',
  source = 'https://en.wikipedia.org/wiki/Sasquatch_Pushing_Over_a_House',
  verified_at = now()
where slug = 'sasquatch-pushing-over-a-house';

-- WISCONSIN ----------------------------------------------------------------

update public.stops set
  description = 'Rhinelander''s larger-than-life Hodag, sculpted by local artist Tracy Goberville and standing outside the Area Chamber of Commerce. The toothy green monster is the city''s signature landmark and a free photo stop year round, celebrating a hoax from the 1890s that never quite went away.',
  public_access = 'roadside',
  source = 'https://explorerhinelander.com/articles/4-spots-to-see-hodags-on-your-next-visit-to-rhinelander/',
  verified_at = now()
where slug = 'chamber-of-commerce-hodag';

-- Left unverified: Rhinelander has many Hodags and this entry may duplicate
-- another. Needs its coordinates matched against the city's Hodag list.
update public.stops set
  description = 'One of Rhinelander''s many Hodags — the horned, clawed beast that has served as the city''s unofficial mascot for over a century. Rhinelander holds dozens of Hodag statues and murals, and this entry has not yet been matched to a specific one.',
  public_access = 'roadside',
  source = 'https://explorerhinelander.com/articles/take-a-hodag-tour-of-rhinelander/'
where slug = 'hodag';

-- WEST VIRGINIA ------------------------------------------------------------

update public.stops set
  description = 'Bob Roach''s twelve-foot stainless-steel Mothman, installed downtown in 2003 and now one of the best-known cryptid landmarks in the country. It stands beside the Mothman Museum and is free to visit day or night.',
  public_access = 'roadside',
  source = 'https://visitpointpleasantwv.com/see-do/',
  verified_at = now()
where slug = 'mothman-statue';

-- WYOMING ------------------------------------------------------------------
-- Left unverified: Yolo is documented as a WyoLotto mascot, and the public
-- artwork outside their Cheyenne office is a painted boot featuring Yolo
-- rather than a standalone jackalope statue. Worth confirming what is actually
-- standing there before sending anyone.

update public.stops set
  name = 'Yolo the Jackpotalope',
  description = 'A painted eight-foot boot outside the WyoLotto office in Cheyenne, carrying Yolo — the lottery''s jackalope mascot, and a nod to Wyoming''s horned-rabbit folklore. Whether there is a standalone jackalope statue here is unconfirmed.',
  public_access = 'roadside',
  source = 'https://wyolotto.com/'
where slug = 'yolo-the-jackalope';
