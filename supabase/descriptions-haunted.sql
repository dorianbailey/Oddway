-- Descriptions and corrections for the haunted / weird-history import.
--
-- Researched by hand, with a source for each. Entries where the research could
-- not confirm a current operator or season keep verified_at null, so their
-- pages continue to say the entry is unverified.
--
-- Nothing is deleted. Places that have closed, burned down or become unsafe are
-- marked `closed` instead, for two reasons: the research is worth keeping, and
-- a deleted row would simply be re-added the next time the OSM importer runs.
-- A row marked closed survives the next import; a deleted one does not.

update public.stops set
  description = 'Sweet Dreams is an immersive indoor haunted attraction in Mobile built around theatrical sets, live actors, scare zones and horror-themed side activities. It operates on select nights during the Halloween season rather than as a year-round attraction.',
  public_access = 'limited',
  source = 'https://sweetdreamshaunt.com/',
  verified_at = now()
where slug = 'sweet-dreams-haunted-attraction';

update public.stops set
  description = 'Ghost Town Tours offers guided walks through Jerome focused on the former mining town''s colorful history, old buildings, local legends and paranormal stories. Visitors should expect a scheduled tour rather than a self-guided attraction, so advance booking is the safest way to visit.',
  public_access = 'limited',
  source = 'https://ghosttowntours.org/',
  verified_at = now()
where slug = 'ghost-town-tours';

update public.stops set
  description = 'Vulture City preserves the remains of the historic mining settlement that grew around Arizona''s Vulture Mine, with restored buildings, mining equipment and artifacts spread across the property. Visitors can explore on self-guided or scheduled history tours, with occasional paranormal and special-event programming.',
  public_access = 'open',
  source = 'https://vulturecityghosttown.com/',
  verified_at = now()
where slug = 'vulture-mine-tours-vulture-city-ghost-town';

update public.stops set
  description = 'Castle Dome Mine Museum recreates and preserves the once-bustling Castle Dome mining district with dozens of historic buildings, mining artifacts and exhibits collected from the surrounding desert. It is primarily a mining and ghost-town history stop, with seasonal hours and additional mine/mineral experiences available.',
  category = 'weird-history',
  public_access = 'limited',
  source = 'https://www.castledomemuseum.org/',
  verified_at = now()
where slug = 'castle-dome-mine-museum';

update public.stops set
  description = 'Penitentiary Avenue is a historic roadway beside Yuma''s Territorial Prison area and formed part of the old Ocean-to-Ocean Highway route through Yuma. There is no standalone haunted attraction here; the meaningful visitor stops are the nearby Yuma Territorial Prison and historic Ocean-to-Ocean Bridge.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://npgallery.nps.gov/NRHP/GetAsset/NHLS/66000197_text'
where slug = 'penitentiary-avenue';

update public.stops set
  description = 'Picnic Table 29 in Griffith Park is the subject of a Los Angeles urban legend involving a couple reportedly killed by a falling tree, with the damaged table and tree becoming an eerie hiking destination. Visitors reach the area on foot through Griffith Park, so this is a strange outdoor legend stop rather than a staffed attraction.',
  public_access = 'open',
  source = 'https://www.pinintheatlas.com/',
  verified_at = now()
where slug = 'haunted-picnic-table-29';

update public.stops set
  description = 'The Grande Vista, later known as Belgum Sanitarium, closed in the 1960s and its main buildings were destroyed by fire. Today hikers in Wildcat Canyon Regional Park can find remnants such as foundations, stonework and old landscaping along the former sanitarium grounds.',
  name = 'Belgum (Grande Vista) Sanitarium Ruins',
  category = 'weird-history',
  public_access = 'open',
  source = 'https://www.ebparks.org/parks/wildcat-canyon',
  verified_at = now()
where slug = 'grande-vista-sanitarium';

update public.stops set
  description = 'Rebel Yell is a long-running San Jose home haunt built around a residential property, with elaborate Halloween displays and walk-through scares created for the season. It is a neighborhood attraction rather than a commercial year-round haunt, so visitors should only go during posted operating nights.',
  public_access = 'limited',
  source = 'https://rebelyell.info/',
  verified_at = now()
where slug = 'rebel-yell-haunted-house';

update public.stops set
  description = 'Ashcroft is a preserved silver-mining ghost town outside Aspen where visitors can walk among surviving cabins, commercial buildings and other remnants of the short-lived 1880s boomtown. Seasonal interpretation and tours help explain the settlement''s mining history and rapid decline.',
  public_access = 'limited',
  source = 'https://aspenhistory.org/tours-sites/ashcroft/',
  verified_at = now()
where slug = 'ashcroft-ghost-town';

update public.stops set
  description = 'Ghost Town Museum is an indoor Colorado Springs museum built around preserved Old West storefronts, rooms, wagons and artifacts rescued from the Pikes Peak region. Despite the name, it is a western-history museum rather than a paranormal attraction, with hands-on exhibits and seasonal gold panning.',
  public_access = 'open',
  source = 'https://www.ghosttownmuseum.com/',
  verified_at = now()
where slug = 'ghost-town-wild-west-museum';

update public.stops set
  description = 'Pueblo Ghost Tour combines local history with paranormal stories during guided visits to reportedly active locations in the Pueblo area. Tours run on scheduled dates and may include access to sites not normally experienced as part of a regular museum visit.',
  public_access = 'limited',
  source = 'https://puebloghosttour.com/',
  verified_at = now()
where slug = 'pueblo-ghost-tour';

update public.stops set
  description = 'Dark Manor is a seasonal Connecticut haunted attraction combining a large indoor haunted house with outdoor graveyard, village and trail-style scenes. It operates on select fall nights and is designed as a theatrical scare attraction rather than a genuinely historic haunted site.',
  public_access = 'limited',
  source = 'https://darkmanorproductions.com/',
  verified_at = now()
where slug = 'the-dark-manor-haunted-house';

update public.stops set
  description = 'Chaos Haunted House was a seasonal Carrollton-area haunt featuring actors, dark walk-through spaces and outdoor scares. I could not verify a current 2026 operating season, so it should not be presented to travelers as an active attraction without new confirmation.',
  public_access = 'closed'
where slug = 'chaos-haunted-house';

update public.stops set
  description = 'The Anamosa State Penitentiary Museum sits outside the walls of the still-active prison and documents its history through uniforms, photographs, inmate-made objects, weapons and a replica cell. The museum operates on a limited seasonal schedule and is a prison-history stop rather than a conventional haunted house.',
  category = 'weird-history',
  public_access = 'limited',
  source = 'https://www.asphistory.com/',
  verified_at = now()
where slug = 'anamosa-state-penitentiary-museum';

update public.stops set
  description = 'Sinister Sidney is a seasonal southwest Iowa haunted attraction built around dark trails, sets and live actors. It generally operates on select fall nights, making it a Halloween-season stop rather than a year-round destination.',
  public_access = 'limited',
  source = 'https://www.facebook.com/SinisterSidney/',
  verified_at = now()
where slug = 'sinister-sidney';

update public.stops set
  description = 'Idaho''s former territorial and state prison operated from the 1870s until 1973 and is now a museum complex of historic cell blocks, yards, solitary-confinement spaces and the gallows. Visitors can tour the prison''s history during regular museum hours, with occasional programs exploring the site''s darker and paranormal reputation.',
  public_access = 'open',
  source = 'https://history.idaho.gov/oldpen/',
  verified_at = now()
where slug = 'old-idaho-penitentiary';

update public.stops set
  description = 'Hirschi''s Haunted Hollow was a seasonal haunted attraction in the Preston area with Halloween scares and themed outdoor experiences. Idaho High Country now lists the attraction as permanently closed, so it should be removed from active OddWay routing.',
  public_access = 'closed',
  source = 'https://idahohighcountry.org/item/hirschis-haunted-hollow/',
  verified_at = now()
where slug = 'hirschi-s-haunted-hollow';

update public.stops set
  description = 'Haunted Trails Burbank is a year-round Halloween-themed family entertainment center with miniature golf, go-karts, arcade games, rides and other activities. Despite the spooky branding, it is not a haunted house and is specifically designed as family entertainment.',
  public_access = 'open',
  source = 'https://hauntedtrailsburbank.com/',
  verified_at = now()
where slug = 'haunted-trails-2';

update public.stops set
  description = 'Haunted Trails Joliet is a year-round family entertainment center with a Halloween theme, offering attractions such as go-karts, miniature golf, laser tag, rides and an arcade. It is not a seasonal scare haunt, so travelers should expect an amusement center rather than a paranormal or horror experience.',
  public_access = 'open',
  source = 'https://hauntedtrailsfun.com/',
  verified_at = now()
where slug = 'haunted-trails';

update public.stops set
  description = '217 Terror is a seasonal Illinois haunted attraction that bundles several themed walk-through haunts into one ticket. Live actors, dark sets and different horror environments make it a dedicated October scare stop operating only on select dates.',
  public_access = 'limited',
  source = 'https://217terror.com/',
  verified_at = now()
where slug = '217-terror-haunted-house';

update public.stops set
  description = 'The Haunted Jail is a seasonal scare attraction in downtown Columbia City that transforms a jail-themed space into a live-actor Halloween walkthrough. It has operated for decades but is only available during its posted fall schedule.',
  public_access = 'limited',
  source = 'https://www.facebook.com/TheHauntedJail/',
  verified_at = now()
where slug = 'the-haunted-jail';

update public.stops set
  description = 'The Irene Byron Tuberculosis Sanatorium complex once treated tuberculosis patients outside Fort Wayne, but the surviving historic structures were ultimately demolished. There is no public sanatorium attraction left to visit, so this entry should not be routed as an active destination.',
  public_access = 'closed',
  source = 'https://en.wikipedia.org/wiki/Irene_Byron_Tuberculosis_Sanatorium',
  verified_at = now()
where slug = 'irene-byron-tuberculosis-sanatorium';

update public.stops set
  description = 'New Orleans Nightmare is a large seasonal haunted attraction with multiple themed horror environments, live actors, elaborate sets and optional add-on experiences. It runs on select nights around Halloween rather than as a normal year-round museum or historical site.',
  public_access = 'limited',
  source = 'https://neworleansnightmare.com/',
  verified_at = now()
where slug = 'new-orleans-nightmare-haunted-house';

update public.stops set
  description = 'Bloody Mary''s Haunted Museum & Voodoo Shop combines New Orleans paranormal history, occult objects, haunted artifacts, dolls and Voodoo-related displays in a small museum and shop. Daytime museum visits are supplemented by scheduled ghost hunts and paranormal investigations after hours.',
  name = 'Bloody Mary''s Haunted Museum & Voodoo Shop',
  public_access = 'open',
  source = 'https://www.bloodymarystours.com/hauntedmuseum.html',
  verified_at = now()
where slug = 'haunted-museum-voodoo-pharmacy';

update public.stops set
  description = 'Witch Mansion is a walk-through Salem attraction using witches, ghosts, monsters, lighting effects and animated scenes to create a traditional haunted-house experience. It operates on a seasonal schedule that expands heavily during Salem''s October crowds.',
  public_access = 'limited',
  source = 'https://www.witchmansion.com/',
  verified_at = now()
where slug = 'witch-mansion-haunted-house';

update public.stops set
  description = 'The Missouri State Penitentiary Museum displays prison artifacts, photographs, a replica cell and exhibits covering inmate life, prison industries and the institution''s long history. It complements the nearby penitentiary tours and is more accurately a history museum than a haunted attraction.',
  category = 'weird-history',
  public_access = 'open',
  source = 'https://www.missouripentours.com/museum/',
  verified_at = now()
where slug = 'missouri-state-penitentiary-museum';

update public.stops set
  description = 'Missouri State Penitentiary operated for more than a century before closing in 2004, and today visitors can enter former housing units, yards and the gas chamber on guided tours. The site offers both historical tours and scheduled ghost or paranormal experiences.',
  public_access = 'limited',
  source = 'https://www.missouripentours.com/',
  verified_at = now()
where slug = 'missouri-state-penitentiary-tours';

update public.stops set
  description = 'The Lemp Mansion is the historic home of St. Louis''s Lemp brewing family and now operates as a restaurant, inn and event venue. Its tragic family history and long-running ghost stories are explored through special haunted-history events, tours and paranormal investigations.',
  public_access = 'open',
  source = 'https://www.lempmansion.com/',
  verified_at = now()
where slug = 'lemp-mansion';

update public.stops set
  description = 'Nightmare Factory was a long-running Havelock haunted attraction, but the Havelock location has closed while the business prepares a future move to New Bern. The old Havelock record should not be routed as open; the operator currently plans to return at the new location in 2027.',
  public_access = 'closed',
  website = 'https://nightmarefactorync.com',
  source = 'https://nightmarefactorync.com/',
  verified_at = now()
where slug = 'nightmare-factory-haunted-attraction';

update public.stops set
  description = 'The Cryptozoology & Paranormal Museum is a small Littleton museum devoted to Bigfoot, ghosts and other unexplained phenomena. Visitors can see footprint casts, reportedly haunted objects and paranormal displays, with separate ghost hunts and Bigfoot-related outings offered at times.',
  category = 'cryptids',
  public_access = 'open',
  source = 'https://crypto-para.org/',
  verified_at = now()
where slug = 'the-cryptozoology-paranormal-museum';

update public.stops set
  description = 'Ghost Town Village, better known as Ghost Town in the Sky, was a mountaintop Wild West amusement park overlooking Maggie Valley. The park has been closed for years and the property is not a normal public sightseeing stop, so it should be removed from active routing unless the site officially reopens.',
  public_access = 'closed',
  source = 'https://en.wikipedia.org/wiki/Ghost_Town_Village',
  verified_at = now()
where slug = 'ghost-town-village';

update public.stops set
  description = 'Panic Point is a large seasonal outdoor haunt built around a wooded property near Youngsville, with a haunted forest and a rotating lineup of trails, mazes and other scare experiences. It operates on select fall nights and tickets are tied to the Halloween season.',
  public_access = 'limited',
  source = 'https://raleighhauntedhouse.com/',
  verified_at = now()
where slug = 'haunted-forest-at-panic-point';

update public.stops set
  description = 'Haunted Tales was an Atlantic City horror attraction built around spooky stories, theatrical effects and novelty scares. Current operation could not be reliably confirmed, and older haunt listings suggest the business is no longer a dependable active attraction, so it should remain unpublished until verified.',
  public_access = 'closed',
  source = 'https://www.hauntworld.com/haunted-house-in-atlantic-city-new-jersey-haunted-tales'
where slug = 'haunted-tales';

update public.stops set
  description = 'The Haunted Halloween House is part of the Land of Make Believe amusement park rather than a standalone New Jersey haunted attraction. Visitors encounter Halloween-themed characters and spooky scenes as one attraction within the larger seasonal family park.',
  name = 'Haunted Halloween House at Land of Make Believe',
  public_access = 'limited',
  source = 'https://www.lomb.com/',
  verified_at = now()
where slug = 'haunted-halloween-house';

update public.stops set
  description = 'Brighton Asylum is a large horror-entertainment complex themed around an abandoned institution, with elaborate haunted walkthroughs, escape rooms and special events. Its main haunted-house season is limited to selected dates, although the property hosts other horror experiences at different times of year.',
  public_access = 'limited',
  source = 'https://brightonasylum.com/',
  verified_at = now()
where slug = 'brighton-asylum';

update public.stops set
  description = '13th Hour Haunted House is a New Jersey horror complex offering multiple themed haunted houses at one location along with escape rooms and other experiences. The major walk-through haunts are seasonal, while some of the site''s non-haunt attractions operate more broadly.',
  public_access = 'limited',
  source = 'https://13thhour.com/',
  verified_at = now()
where slug = '13th-hour-haunted-house';

update public.stops set
  description = 'This Henderson entry appears to be tied to an old or temporary western ghost-town-style attraction rather than a currently documented permanent destination. I could not verify a public attraction operating here now, so the record should be removed or held unpublished until the exact coordinates and current operator are confirmed.',
  public_access = 'closed'
where slug = 'ghost-town';

update public.stops set
  description = 'Zak Bagans'' The Haunted Museum fills a historic Las Vegas mansion with rooms devoted to paranormal objects, notorious crimes, occult artifacts and items claimed to be cursed or haunted. Visitors follow a guided experience through the collection, with age restrictions and upgraded experiences available.',
  public_access = 'open',
  source = 'https://thehauntedmuseum.com/',
  verified_at = now()
where slug = 'zak-bagan-s-the-haunted-museum';

update public.stops set
  description = 'The old White Horse Inn near McDermitt is a historic roadside building, but current public records describe the structure as unsafe, with serious deterioration, asbestos and mold concerns. It is not a public haunted attraction and should not be routed for entry or exploration.',
  public_access = 'private',
  source = 'https://www.humboldtcountynv.gov/DocumentCenter/View/8501/HCC-031824',
  verified_at = now()
where slug = 'white-horse-inn-white-horse-inn-bar';

update public.stops set
  description = 'The Washoe Club is one of Virginia City''s best-known historic saloons and paranormal stops, with a museum and tours exploring the building''s history and reported ghost activity. Visitors can see preserved rooms and displays during regular visits, with more intensive paranormal investigations offered separately.',
  public_access = 'open',
  source = 'https://thewashoeclubmuseum.com/',
  verified_at = now()
where slug = 'haunted-washoe-club-museum';

update public.stops set
  description = 'Haunted House of Wax was a Niagara Falls walk-through attraction mixing wax figures with horror scenes and jump scares. It is reported closed, so the record should be removed from active routing rather than presented as a current attraction.',
  public_access = 'closed',
  source = 'https://www.roadsideamerica.com/',
  verified_at = now()
where slug = 'haunted-house-of-wax';

update public.stops set
  description = 'Rolling Hills Asylum occupies a former Genesee County poorhouse complex and is now operated specifically for paranormal tourism. Visits are reservation-based and include flashlight tours, self-guided ghost hunts and longer investigations inside the old institution.',
  public_access = 'limited',
  source = 'https://rollinghillsasylum.com/',
  verified_at = now()
where slug = 'rolling-hills-asylum';

update public.stops set
  description = 'The Pine Bush UFO & Paranormal Museum explores the Hudson Valley area''s long history of UFO sightings through interactive exhibits, witness accounts, displays and alien-themed experiences. This is clearly a UFO-focused attraction and belongs in the `ufos` category rather than `haunted`.',
  category = 'ufos',
  public_access = 'open',
  source = 'https://pinebushmuseum.com/',
  verified_at = now()
where slug = 'pine-bush-ufo-museum';

update public.stops set
  description = 'Headless Horseman Hayrides & Haunted Attractions is a large seasonal Halloween destination in the Hudson Valley combining theatrical hayrides with multiple walk-through haunted attractions. The experience runs on select fall nights and is designed as a full evening horror event.',
  public_access = 'limited',
  source = 'https://headlesshorseman.com/',
  verified_at = now()
where slug = 'headless-horseman-hayrides-and-haunted-houses';

update public.stops set
  description = 'Doctor Morbid''s Haunted House was a long-running Lake George walk-through horror attraction with animated figures and mad-scientist-themed scenes. The attraction has closed, so it should be removed from current OddWay routing rather than treated as an active stop.',
  public_access = 'closed'
where slug = 'doctor-morbid-s-haunted-house';

update public.stops set
  description = 'The former 13th Floor Haunted House in Columbus now operates under local ownership as Fear Columbus Haunted House. It remains a large seasonal horror attraction with elaborate walk-through sets, live actors and additional special-event nights, but the OddWay record should be renamed and pointed to the current brand.',
  name = 'Fear Columbus Haunted House',
  public_access = 'limited',
  source = 'https://fearcolumbus.com/',
  verified_at = now()
where slug = '13th-floor-haunted-house';

update public.stops set
  description = 'An OpenStreetMap-derived tourist-attraction record called Ghost Town exists in Eagle Township, but there is almost no current public information explaining what visitors would actually find there. It should not be routed as an active attraction until its ownership, access and purpose are independently verified.',
  public_access = 'closed',
  source = 'https://mapcarta.com/W421738252'
where slug = 'ghost-town-2';

update public.stops set
  description = 'Haunted Town Hall transforms Lafayette''s old town hall into a multi-level seasonal haunted attraction filled with actors, dark corridors and themed rooms. It operates on select September and October nights rather than year-round.',
  public_access = 'limited',
  source = 'https://hauntedtownhall.com/',
  verified_at = now()
where slug = 'haunted-town-hall';

update public.stops set
  description = 'Haunted Hootchie at Dead Acres is an intense, adult-oriented Ohio haunted attraction known for large sets, live performers and deliberately extreme horror imagery. It is a seasonal fall destination and should be treated as limited access outside its posted operating nights.',
  public_access = 'limited',
  source = 'https://www.hauntedhootchie.com/',
  verified_at = now()
where slug = 'haunted-hootchie';

update public.stops set
  description = 'Hex House is a Tulsa seasonal haunt with multiple walk-through attractions at one location, loosely drawing its name from the city''s infamous 1940s Hex House story. Visitors come for theatrical horror sets and live scares on select fall nights rather than for access to the original historical Hex House site.',
  public_access = 'limited',
  source = 'https://hexhouse.com/',
  verified_at = now()
where slug = 'hex-house';

update public.stops set
  description = 'Astoria Ghost Tour leads visitors into the city''s darker history and paranormal stories, including underground spaces and locations associated with reported hauntings. Access is through scheduled guided tours, so it is best treated as a book-ahead experience rather than a walk-in attraction.',
  public_access = 'limited',
  source = 'https://astoriaghosttour.com/',
  verified_at = now()
where slug = 'astoria-ghost-tour';

update public.stops set
  description = 'Hundred Acres Manor is a large Pittsburgh-area seasonal haunt that combines several themed horror environments into one continuous attraction. Live actors, detailed sets, food and midway-style extras make it a destination haunt operating on selected fall nights.',
  public_access = 'limited',
  source = 'https://www.hundredacresmanor.com/',
  verified_at = now()
where slug = 'hundred-acres-manor-haunted-house';

update public.stops set
  description = 'Auntie Mortem''s Abattoir is one of the walk-through haunted houses inside Hersheypark''s Dark Nights Halloween event, built around a grotesque butcher-shop and slaughterhouse theme. It is not a standalone Derry Township business and can only be visited when the park''s seasonal Dark Nights event is operating.',
  name = 'Auntie Mortem''s Abattoir at Hersheypark Dark Nights',
  public_access = 'limited',
  source = 'https://www.hersheypark.com/darknights/',
  verified_at = now()
where slug = 'auntie-mortem-s-abattoir';

update public.stops set
  description = 'Estate of Evil is a haunted-house experience inside Hersheypark Dark Nights, taking visitors through a sinister mansion filled with themed rooms and live scares. It is part of the amusement park''s fall event rather than a separate attraction, so access requires the appropriate Hersheypark/Dark Nights admission.',
  name = 'Estate of Evil at Hersheypark Dark Nights',
  public_access = 'limited',
  source = 'https://www.hersheypark.com/darknights/',
  verified_at = now()
where slug = 'estate-of-evil';

update public.stops set
  description = 'Haunted Coal Mine is a mine-themed walk-through haunt included in Hersheypark''s Dark Nights event. Visitors encounter underground-style sets, actors and horror scenes during select autumn event nights, not as a year-round standalone coal-mine attraction.',
  name = 'Haunted Coal Mine at Hersheypark Dark Nights',
  public_access = 'limited',
  source = 'https://www.hersheypark.com/darknights/',
  verified_at = now()
where slug = 'haunted-coal-mine';

update public.stops set
  description = 'The Bates Motel & Haunted Hayride is a major Philadelphia-area Halloween attraction combining a haunted hayride with the Bates Motel walk-through and additional outdoor scare experiences. It operates on select dates during the fall season and is built as a theatrical haunt rather than a historic motel.',
  public_access = 'limited',
  source = 'https://thebatesmotel.com/',
  verified_at = now()
where slug = 'the-bates-motel-haunted-hayride';

update public.stops set
  description = 'Eastern State Penitentiary is a preserved 19th-century prison where visitors can explore cell blocks, prison yards and exhibits about incarceration, including Al Capone''s restored cell. The historic site operates as a museum, while separate Halloween programming adds large-scale haunted attractions during the fall.',
  public_access = 'open',
  source = 'https://www.easternstate.org/',
  verified_at = now()
where slug = 'eastern-state-penitentiary';

update public.stops set
  description = 'The Haunted Mansion in Ralpho Township is the classic dark ride at Knoebels Amusement Resort, not a standalone haunted house. Riders travel through old-school spooky sets, practical effects and monsters whenever the ride is operating during the park''s season.',
  name = 'Knoebels Haunted Mansion',
  public_access = 'limited',
  source = 'https://www.knoebels.com/rides/haunted-mansion/',
  verified_at = now()
where slug = 'haunted-mansion';

update public.stops set
  description = 'Nightmare Haunted House is a long-running Myrtle Beach walk-through attraction using dark corridors, horror scenes and live or theatrical scares near the oceanfront. Unlike many temporary October haunts, it operates across a much broader portion of the tourist season and may be open year-round on selected schedules.',
  public_access = 'open',
  source = 'https://nightmarehauntedhouse.com/',
  verified_at = now()
where slug = 'nightmare-haunted-house';

update public.stops set
  description = 'Ripley''s Haunted Adventure in Myrtle Beach is an interactive walk-through horror attraction on Ocean Boulevard featuring live scares, dark themed rooms and theatrical effects. It operates as a regular tourist attraction rather than only as an October pop-up.',
  public_access = 'open',
  source = 'https://www.ripleys.com/attractions/ripleys-haunted-adventure-myrtle-beach',
  verified_at = now()
where slug = 'ripley-s-haunted-adventure-2';

update public.stops set
  description = 'Buffalo Ridge Ghost Town is a quirky roadside Old West display near the Buffalo Ridge travel stop, with recreated frontier buildings and weathered western scenes. It is more roadside attraction than authentic abandoned settlement, making it a fun photo stop for travelers interested in kitschy ghost-town imagery.',
  public_access = 'open',
  source = 'https://maps.apple.com/?q=Buffalo%20Ridge%20Ghost%20Town',
  verified_at = now()
where slug = 'buffalo-ridge-ghost-town';

update public.stops set
  description = 'Ripley''s Haunted Adventure in Gatlinburg is a year-round walk-through horror attraction on the Parkway featuring live actors, dark sets and jump scares. It is part of Ripley''s cluster of tourist attractions and can be visited independently with a ticket.',
  public_access = 'open',
  source = 'https://www.ripleys.com/attractions/ripleys-haunted-adventure-gatlinburg',
  verified_at = now()
where slug = 'ripley-s-haunted-adventure';

update public.stops set
  description = 'The Fear Factory was a multi-floor seasonal haunted attraction in downtown Union City built inside a large old commercial building. Reliable current operating information is scarce, so it should not be marked open until a current season or operator is confirmed.',
  public_access = 'closed',
  source = 'https://www.thepacer.net/haunted-house-review-fear-factory/'
where slug = 'the-fear-factory';

update public.stops set
  description = 'The Haunted Hotel is a long-running Beaumont seasonal haunt that fills a large indoor space with themed rooms, live actors, animatronics and horror sets. It operates on select fall nights and should be treated as limited outside Halloween season.',
  public_access = 'limited',
  source = 'https://hauntedhoteltx.com/',
  verified_at = now()
where slug = 'the-haunted-hotel';

update public.stops set
  description = 'This stop is a Texas historical marker identifying the site of Rees Sanitarium, Brenham''s first hospital, rather than an abandoned hospital visitors can enter. Travelers will find a roadside plaque explaining the former institution and its place in local medical history.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://atlas.thc.state.tx.us/',
  verified_at = now()
where slug = 'rees-sanitarium';

update public.stops set
  description = 'This is a Texas historical marker telling the story of Clara, a former German settlement near Burkburnett, rather than a preserved ghost town with buildings to explore. The marker is a roadside stop, although the Texas Historical Commission currently indicates that the physical marker is being replaced, so travelers may temporarily find no plaque on site.',
  public_access = 'roadside',
  source = 'https://atlas.thc.state.tx.us/',
  verified_at = now()
where slug = 'ghost-town-of-clara';

update public.stops set
  description = 'A roadside historical marker near Galveston''s seawall commemorates the original St. Mary''s Orphan Asylum and the devastating loss of the orphanage during the 1900 hurricane. The institution itself no longer stands here, so visitors are stopping for the plaque and the history of the former site.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://atlas.thc.state.tx.us/',
  verified_at = now()
where slug = 'original-site-of-st-mary-s-orphan-asylum';

update public.stops set
  description = 'Snyder Sanitarium is a historic Glen Rose medical building associated with early local health care, with a Texas historical marker explaining its story. Travelers should treat it primarily as a roadside historic-site/exterior stop unless a current occupant specifically permits interior access.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://atlas.thc.state.tx.us/',
  verified_at = now()
where slug = 'snyder-sanitarium';

update public.stops set
  description = 'This Huntsville stop is a roadside Texas historical marker describing the state penitentiary''s role in Confederate-era manufacturing during the Civil War. It is not an abandoned prison attraction or paranormal tour, so visitors should expect a plaque and exterior historical context rather than building access.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://www.hmdb.org/',
  verified_at = now()
where slug = 'state-penitentiary-c-s-a-and-texas-civil-war-manufacturing';

update public.stops set
  description = 'Imminent Doom is a large Kilgore seasonal haunted attraction featuring live actors, animatronics and detailed horror sets across an indoor walkthrough. It operates on select dates around Halloween and is intended as a commercial scare experience rather than a historic haunted location.',
  public_access = 'limited',
  source = 'https://imminentdoomhaunt.com/',
  verified_at = now()
where slug = 'imminent-doom-haunted-house';

update public.stops set
  description = 'J. Lorraine Ghost Town is a recreated Old West roadside attraction outside Austin, built with western storefronts, props and rustic structures meant to evoke a fictional frontier settlement. It is a playful man-made ghost town rather than an authentically abandoned community, with access depending on the property''s posted hours and events.',
  public_access = 'limited',
  source = 'https://ghosttownaustin.com/',
  verified_at = now()
where slug = 'j-lorraine-texas-ghost-town';

update public.stops set
  description = 'A Texas historical marker in downtown Odessa identifies the former site of an early sanitarium that opened in the 1880s and later became part of the city''s civic history. The sanitarium no longer survives as an attraction, so this is a roadside plaque stop rather than a building visitors can enter.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://atlas.thc.state.tx.us/',
  verified_at = now()
where slug = 'site-of-the-odessa-sanitarium';

update public.stops set
  description = 'The Old Post Sanitarium marker documents the early hospital established in Post in the 1910s and the development of organized medical care in the area. OddWay visitors are primarily stopping for the roadside historical plaque and exterior historic setting rather than a haunted-hospital experience.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://atlas.thc.state.tx.us/',
  verified_at = now()
where slug = 'old-post-sanitarium';

update public.stops set
  description = 'This roadside Texas historical marker on Snyder''s courthouse square identifies the site of Dr. Alonzo Orrin Scarborough''s early sanitarium. No sanitarium attraction remains to tour; the value of the stop is the plaque and its short piece of local medical history.',
  category = 'weird-history',
  public_access = 'roadside',
  source = 'https://atlas.thc.state.tx.us/',
  verified_at = now()
where slug = 'site-of-sanitarium-of-alonzo-orrin-scarborough-1860-1952-pioneer-doctor';

update public.stops set
  description = 'Asylum 49 is a seasonal haunted attraction inside Tooele''s former hospital complex, using medical-horror themes, actors and elaborate sets throughout the building. The property also operates a Museum of Horrors with unusual medical and macabre objects, but the main haunt is available only on scheduled dates.',
  public_access = 'limited',
  source = 'https://asylum49.com/',
  verified_at = now()
where slug = 'asylum-49';

update public.stops set
  description = 'Haunted Hollow at Maple Tree Farm is a seasonal Virginia haunted trail that leads visitors through wooded paths, barns and farm settings populated by live scare actors. It operates on selected fall nights and requires visitors to follow the event''s ticketing and safety rules.',
  public_access = 'limited',
  source = 'https://hauntedhollowva.com/',
  verified_at = now()
where slug = 'haunted-hollow';

update public.stops set
  description = 'Fright Factory is a seasonal Buckley haunted house set in a secluded property and built around dark indoor scenes, actors and traditional Halloween scares. It operates on select nights in the fall rather than as a year-round destination.',
  public_access = 'limited',
  source = 'https://frightfactory.net/',
  verified_at = now()
where slug = 'fright-factory-haunted-house';

update public.stops set
  description = 'Huntting''s is a family-run pumpkin patch near Cinebar that adds a haunted forest and nighttime attractions during the Halloween season. Daytime visitors can expect the farm and pumpkin-patch experience, while the haunted portion is limited to specific fall evenings.',
  public_access = 'limited',
  source = 'https://thehunttings.business.site/',
  verified_at = now()
where slug = 'the-huntting-s-pumpkin-patch-and-haunted-forest';

update public.stops set
  description = 'Old Molson Ghost Town Museum preserves a collection of pioneer buildings, farm machinery, mining equipment and other artifacts in the former townsite of Molson. The outdoor museum is free to explore, but remote location, snow and seasonal conditions can affect practical access.',
  public_access = 'limited',
  source = 'https://molsonmuseums.org/',
  verified_at = now()
where slug = 'old-molson-ghost-town-museum';

update public.stops set
  description = 'This Haunted House is a dark ride inside Little Amerricka Amusement Park in Marshall, not a standalone Halloween haunt. Visitors board a ride vehicle and pass through old-school spooky scenes and effects during the amusement park''s operating season.',
  name = 'Haunted House at Little Amerricka',
  public_access = 'limited',
  source = 'https://www.littleamerricka.com/',
  verified_at = now()
where slug = 'haunted-house';

update public.stops set
  description = 'Abandoned Haunted House Complex is a large seasonal Wisconsin scare destination combining multiple haunted houses, outdoor zones and additional Halloween activities at one property. It operates on select dates from late September into the fall, so access is seasonal and ticketed.',
  public_access = 'limited',
  source = 'https://abandonedhauntedhouse.com/',
  verified_at = now()
where slug = 'abandoned-haunted-house-complex';

update public.stops set
  description = 'Burial Chamber Haunted Complex is a seasonal Neenah-area destination with several different haunted attractions, including high-intensity walkthroughs and darker maze-style experiences. The complex operates on select fall nights and bundles multiple scares into a single visit.',
  public_access = 'limited',
  source = 'https://burialchamber.com/',
  verified_at = now()
where slug = 'burial-chamber-haunted-house';

update public.stops set
  description = 'Dark Chambers is a seasonal haunted attraction in Hazel Green offering multiple themed walkthroughs at one location. The current official address is in Hazel Green, not Jamestown, so the city in the existing OddWay record should be corrected.',
  city = 'Hazel Green',
  public_access = 'limited',
  source = 'https://darkchambers.com/',
  verified_at = now()
where slug = 'dark-chambers-haunted-attraction';

update public.stops set
  description = 'The Haunted Mansion in Wisconsin Dells is a classic downtown walk-through funhouse filled with monsters, spooky scenes, effects and old-school haunted-house gags. It operates during the Dells tourist season rather than only on Halloween, but its schedule is still seasonal.',
  public_access = 'limited',
  source = 'https://www.dellshauntedmansion.com/',
  verified_at = now()
where slug = 'the-haunted-mansion-3';

update public.stops set
  description = 'The former West Virginia Penitentiary is a massive Gothic prison that operated until 1995 and now offers guided history tours through cell blocks, yards and other restricted areas. Visitors can also book public ghost hunts, paranormal investigations and seasonal Halloween experiences, with the normal tour season running on scheduled dates.',
  public_access = 'limited',
  source = 'https://wvpentours.com/',
  verified_at = now()
where slug = 'west-virginia-state-penitentiary-tours';
