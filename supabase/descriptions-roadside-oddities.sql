-- Descriptions and corrections for the roadside oddities import.
--
-- Researched by hand with a source for each. Twenty-two city labels were
-- wrong: the offline gazetteer picks the nearest town with a population over
-- a thousand, so Cawker City became Osborne and Darwin became Dassel. The
-- coordinates were always right; only the labels were not.
--
-- Access is mostly 'roadside' rather than the 'open' the importer assumed.
-- These are things you pull over to look at, not places you go inside, and
-- two are on private land where that distinction matters.

update public.stops set
  description = 'Nome’s giant metal gold pan is roughly 20 feet across and stands with the Three Lucky Swedes statues as a tribute to the 1898 gold discovery that launched the Nome Gold Rush. The exact installation year is not well documented in current sources; today it is a free outdoor photo stop at Bering Street and Seppala Road, and Visit Nome describes it as the largest metal gold pan in the United States.',
  public_access = 'roadside',
  source = 'https://www.visitnomealaska.com/summer',
  name = 'Nome Giant Gold Pan',
  verified_at = now()
where slug = 'world-s-biggest-gold-pan';

update public.stops set
  description = 'This oversized metal mosquito is part of the deliberately odd collection around Mukluk Land outside Tok, a seasonal roadside attraction and museum filled with unusual exhibits and games. The exact construction year of the mosquito is not well documented, but the sculpture is still mapped beside Mukluk Land; visitors should expect the surrounding attraction itself to keep limited seasonal hours.',
  public_access = 'limited',
  source = 'https://muklukland.com/',
  verified_at = now()
where slug = 'world-s-largest-mosquito';

update public.stops set
  description = 'Dothan’s tiny triangular block sits at the meeting of North Appletree, North College and East Troy streets. The Camellia Garden Club marked it on May 1, 1964 after Ripley’s recognition, and travelers today find a tiny traffic island with street signs and a granite marker that can be viewed from the surrounding public streets.',
  public_access = 'roadside',
  source = 'https://www.atlasobscura.com/places/worlds-smallest-city-block',
  verified_at = now()
where slug = 'world-s-smallest-city-block';

update public.stops set
  description = 'This giant Christmas pickle began life as an oversized Chili’s pepper before artist Eric Brown repainted and repurposed it as a pickle wearing a Santa hat. The current artwork was in place by 2021 and stands outdoors along Wells Lake Road near Barling/Fort Smith as a quick roadside photo stop.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/78502',
  verified_at = now()
where slug = 'world-s-largest-christmas-pickle';

update public.stops set
  description = 'Poki is a roughly two-ton desert-tortoise sculpture commissioned by local resident Bill Hayes and originally displayed on his property. Hayes donated it to the community when he moved in late 2013, and it was moved to a public location in January 2014; travelers can still see Poki as a roadside photo stop.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/41526',
  verified_at = now()
where slug = 'poki-world-s-largest-desert-tortoise';

update public.stops set
  description = 'This OpenStreetMap-mapped outdoor artwork is a large ball sculpture near the Ferraro Soccer Fields and the Glendale/Los Angeles boundary. I could not find a reliable published artist, official title or construction date, so the safest description is simply a public-facing oversized sculpture that travelers can view as a quick roadside curiosity.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N6862517420',
  name = 'Giant Ball Sculpture'
where slug = 'giant-ball';

update public.stops set
  description = 'This is the Joor Muffler Man, a classic oversized fiberglass roadside figure associated with Joor Muffler in Escondido. Escondido tourism material dates the figure to 1969, and travelers still find the giant as a piece of old-school roadside Americana outside the business.',
  public_access = 'roadside',
  source = 'https://visitescondido.com/info/maps-getting-around/',
  name = 'Joor Muffler Man',
  verified_at = now()
where slug = 'muffler-man';

update public.stops set
  description = 'The Mystery Spot is a classic gravity-house roadside attraction in the redwoods outside Santa Cruz, where tilted structures and forced perspective make visitors appear to lean at impossible angles. It was discovered in 1939 and opened to the public around 1940; today visitors buy tickets for a roughly 45-minute guided experience and can also use the hiking trail and gift shop.',
  public_access = 'limited',
  source = 'https://www.mysteryspot.com/what-is-it',
  verified_at = now()
where slug = 'mystery-spot';

update public.stops set
  description = 'The giant Paul Bunyan and Babe the Blue Ox guard the entrance to Trees of Mystery on California’s Redwood Highway. The attraction’s Bunyan figures evolved through several versions beginning in the 1940s, with Babe added in 1951 and the current giant Paul dating to the late 1950s/early 1960s; travelers can photograph the statues at the entrance while the forest attraction beyond them is ticketed.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/2040',
  city = 'Klamath',
  state = 'CA',
  verified_at = now()
where slug = 'paul-bunyan-and-babe';

update public.stops set
  description = 'Sierra Madre’s enormous Chinese wistaria vine began as a one-gallon plant purchased by Alice Brugman in April 1894 and eventually spread across neighboring residential properties. Because the vine grows on private homes, travelers normally see it only during the city’s annual Wistaria Festival/open-house period rather than as a daily walk-up attraction.',
  public_access = 'limited',
  source = 'https://www.sierramadreca.gov/life-wellness/library/sierra-madre-historical-archives/',
  verified_at = now()
where slug = 'wisteria-vine-worlds-largest-blossoming-plant';

update public.stops set
  description = 'Riverside’s giant concrete cup was built as advertising for the paper-cup factory that operated here under Lily-Tulip and later Sweetheart Cup; the adjacent plant produced cups from 1958 to 1997. The exact construction year of the monument is poorly documented, but the cup still stands behind a fence at the former industrial site and is best treated as a roadside photo stop.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/203',
  city = 'Riverside',
  state = 'CA',
  verified_at = now()
where slug = 'world-s-largest-paper-cup';

update public.stops set
  description = 'Lindsay’s giant concrete black olive originally stood at the local olive-packing cooperative, reflecting the town’s history as a major olive-processing center. After the plant closed it was rescued and moved to the former Olive Tree Inn around 1999–2000, and today travelers find it in the parking lot of the property now operated as a Super 8.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/4022',
  verified_at = now()
where slug = 'world-s-largest-olive';

update public.stops set
  description = 'Huntington Beach’s enormous surfboard was built for the Epic Big Board Ride on June 20, 2015, when 66 people successfully rode it and Guinness certified it as the world’s largest surfboard. The 42-foot board was subsequently placed on display at the International Surfing Museum, so visitors see it as part of the museum rather than as a freestanding roadside object.',
  public_access = 'limited',
  source = 'https://www.guinnessworldrecords.com/news/2015/6/worlds-largest-surfboard-66-catch-a-wave-and-ride-their-way-to-a-record-video-386094',
  verified_at = now()
where slug = 'world-s-largest-surfboard';

update public.stops set
  description = 'This approximately 44-foot carving was cut upright from a dead redwood at Confusion Hill, making it a freestanding chainsaw carving rather than a totem carved horizontally and raised later. Confusion Hill says the carving itself took about three months to make; its exact year is not well documented, and travelers now find it in the attraction’s parking area at Piercy.',
  public_access = 'limited',
  source = 'https://www.confusionhill.com/faqs',
  city = 'Piercy',
  state = 'CA',
  verified_at = now()
where slug = 'world-s-tallest-free-standing-redwood-chainsaw-carving';

update public.stops set
  description = 'Baker’s 134-foot electric thermometer was created by businessman Willis Herron to commemorate the 134°F temperature recorded in nearby Death Valley. The first version was built in 1991 but toppled in high winds before opening, and the rebuilt structure was illuminated in October 1992; it remains a prominent I-15 roadside landmark.',
  public_access = 'roadside',
  source = 'https://www.pbssocal.org/history-society/return-of-the-desert-wayfinder-worlds-tallest-thermometer-in-baker-ca',
  verified_at = now()
where slug = 'world-s-tallest-thermometer';

update public.stops set
  description = 'The Kriz family’s enormous horseshoe pile is the accumulation of generations of farrier work, with the current pile begun after a 1955 flood washed away an earlier collection. It was moved to the Kriz Farm in Bethany in 1978 and continues to grow, but it is on a working private farm rather than a public roadside attraction, so visitors should not enter without permission.',
  public_access = 'private',
  source = 'https://www.farmshow.com/a_article.php?aid=22639',
  name = 'Kriz Farm Horseshoe Pile',
  city = 'Bethany',
  state = 'CT',
  verified_at = now()
where slug = 'world-s-largest-pile-of-horseshoes';

update public.stops set
  description = 'This oversized Amish-style chair was built in March 2013 outside Owltown Market south of Blairsville. It remains a free roadside photo stop beside the market, although visitors are asked not to climb or sit on the chair.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/38152',
  verified_at = now()
where slug = 'world-s-largest-amish-chair';

update public.stops set
  description = 'Ashburn’s giant peanut monument was originally erected in 1975 to celebrate the local peanut-processing industry. Hurricane Michael destroyed the earlier peanut in 2018, and a new steel-supported monument was completed in 2023 after a community fundraising effort; travelers now see the rebuilt peanut as a roadside landmark.',
  public_access = 'roadside',
  source = 'https://www.worldrecordacademy.org/2023/9/worlds-largest-peanut-monument-world-record-in-ashburn-georgia-423347',
  verified_at = now()
where slug = 'world-s-largest-peanut-monument';

update public.stops set
  description = 'The giant bullhead is actually in Crystal Lake, Iowa, not Forest City. Carl Frick and Rush Gabrilson built the 12-foot fish in 1958, and it was restored in 2007; today it sits by Crystal Lake as a free lakeside photo stop.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/4339',
  city = 'Crystal Lake',
  state = 'IA',
  verified_at = now()
where slug = 'world-s-largest-bullhead';

update public.stops set
  description = 'Sac City’s current popcorn ball was built by community volunteers in 2016 and weighs 9,370 pounds, replacing earlier record attempts by the town. It is protected inside its own transparent display building near the Sac City Museum Village, allowing travelers to see the giant snack even when the museum itself is closed.',
  public_access = 'roadside',
  source = 'https://www.traveliowa.com/places/sac-city-museum-village-and-world-s-largest-popcorn-ball/51/',
  verified_at = now()
where slug = 'world-s-largest-popcorn-ball';

update public.stops set
  description = 'Strawberry Point’s 15-foot fiberglass strawberry was dedicated in the late 1960s and has stood outside City Hall for more than half a century. Restored again in 2025, it remains an easy public photo stop and one of the town’s defining landmarks.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/4035',
  verified_at = now()
where slug = 'world-s-largest-strawberry';

update public.stops set
  description = 'Atlanta’s giant is the famous Bunyon Giant, an original fiberglass Muffler Man installed at Bunyon’s restaurant in Cicero when it opened in 1966. After the restaurant closed, the figure was moved to Atlanta in November 2003 and dedicated there in 2004; travelers now find him standing along the town’s Route 66 corridor holding a giant hot dog.',
  public_access = 'roadside',
  source = 'https://www.hmdb.org/m.asp?m=270597',
  verified_at = now()
where slug = 'paul-bunyan-statue';

update public.stops set
  description = 'Casey’s Big Pencil is a deliberately oversized teacher-style pencil created as part of the town’s Big Things Small Town project. The city explicitly says it is often mistaken for the world’s largest but is only a supersized replica, and visitors can see it free at 8 West Main Street along with Casey’s cluster of giant objects.',
  public_access = 'roadside',
  source = 'https://www.bigthingssmalltown.com/yardstick-pencil',
  name = 'Casey Big Pencil',
  verified_at = now()
where slug = 'world-s-biggest-pencil';

update public.stops set
  description = 'Casey’s Big Yardstick is a 36-foot-long yardstick with every inch enlarged to a foot, built as part of Jim Bolin’s town-wide Big Things project. It is not presented by Casey as a current Guinness record holder, but it remains a free outdoor stop at 3 East Main Street within walking distance of the town’s other oversized objects.',
  public_access = 'roadside',
  source = 'https://www.bigthingssmalltown.com/yardstick-pencil',
  name = 'Casey Big Yardstick',
  verified_at = now()
where slug = 'world-s-biggest-yard-stick';

update public.stops set
  description = 'Collinsville’s 170-foot Brooks catsup-bottle water tower was built in 1949 by Caldwell Tanks for the G.S. Suppiger catsup plant. Saved from demolition and restored by a community preservation campaign in 1995, it remains beside Route 159 as one of America’s best-known roadside landmarks and can be photographed from nearby public areas.',
  public_access = 'roadside',
  source = 'https://www.catsupbottle.com/index.html',
  verified_at = now()
where slug = 'world-s-largest-catsup-bottle';

update public.stops set
  description = 'Lincoln’s Railsplitter Covered Wagon was built by David Bentley and donated to the city in January 2007. The 25-foot-tall, 40-foot-long wagon carries an oversized seated Abraham Lincoln and remains a free Route 66 photo stop; its canvas cover is removed during winter and returned in spring.',
  public_access = 'roadside',
  source = 'https://www.lincolnil.gov/lincoln-route-66',
  verified_at = now()
where slug = 'world-s-largest-covered-wagon';

update public.stops set
  description = 'Casey’s giant knitting needles were created by Jim Bolin and officially held the world-record title from 2013 to 2017. They are 13.75 feet long and are now presented as the former world’s largest, displayed with the town’s giant crochet hook at 2 East Main Street.',
  public_access = 'roadside',
  source = 'https://www.bigthingssmalltown.com/knitting-needles-and-crocket-hook',
  name = 'Former World''s Largest Knitting Needles',
  verified_at = now()
where slug = 'world-s-largest-knitting-needles';

update public.stops set
  description = 'Casey’s enormous teeter-totter is another piece of the Big Things Small Town project, built as a functioning oversized playground object and certified as a world-record attraction. It is visible outdoors for free beside Casey’s other giants, while opportunities to actually ride it are restricted to scheduled dates during the tourism season.',
  public_access = 'roadside',
  source = 'https://www.bigthingssmalltown.com/list',
  verified_at = now()
where slug = 'world-s-largest-teeter-totter';

update public.stops set
  description = 'Casey’s first major world-record project was the giant wind chime, whose steel framework went up November 17, 2011 and whose chimes were installed on December 15 that year. The 54-foot structure still stands downtown and visitors can pull the rope to make the huge chimes sound.',
  public_access = 'roadside',
  source = 'https://www.bigthingssmalltown.com/wind-chime',
  verified_at = now()
where slug = 'world-s-largest-windchime';

update public.stops set
  description = 'Casey’s enormous mailbox was built to satisfy Guinness requirements as a genuinely functional mailbox: visitors can climb the stairs inside and mail letters that raise its working red flag. Created during Casey’s mid-2010s Big Things expansion, it remains a free downtown attraction at 19 West Main Street.',
  public_access = 'roadside',
  source = 'https://www.bigthingssmalltown.com/mailbox',
  verified_at = now()
where slug = 'worlds-largest-mailbox';

update public.stops set
  description = 'Casey’s 56-foot, 46,200-pound rocking chair took two years to complete and officially claimed its record on October 20, 2015 after ten people demonstrated that it could actually rock. It is now fixed in place and remains a free outdoor centerpiece of Casey’s walkable collection of giant objects.',
  public_access = 'roadside',
  source = 'https://www.bigthingssmalltown.com/rocking-chair',
  verified_at = now()
where slug = 'worlds-largest-rocking-chair';

update public.stops set
  description = 'Mike Carmichael began the Ball of Paint on January 1, 1977 by repeatedly coating a baseball, eventually turning it into a multiton object with tens of thousands of paint layers. The Alexandria attraction is still an active family project, and visitors who arrange a visit can add their own coat of paint and receive a certificate.',
  public_access = 'limited',
  source = 'https://www.worldslargestballofpaint.com/',
  verified_at = now()
where slug = 'worlds-largest-ball-of-paint';

update public.stops set
  description = 'This community-grown ball is in Cawker City, not Osborne. Farmer Frank Stoeber began rolling discarded sisal twine into a ball on Christmas Eve 1953, and the town later took over the tradition; visitors now find it beneath a roadside shelter and the community continues adding twine during special events.',
  public_access = 'roadside',
  source = 'https://www.cawkercitykansas.com/',
  city = 'Cawker City',
  state = 'KS',
  verified_at = now()
where slug = 'world-s-largest-ball-of-sisal-twine';

update public.stops set
  description = 'Artist Erika Nelson created this deliberately tongue-twisting collection of miniature replicas of famous giant roadside attractions, turning the idea of “world’s largest” inside out. The collection now has a home at the Roadside Sideshow Expo in Lucas, where travelers can self-tour during the April-through-October season and see tiny versions of oversized American landmarks.',
  public_access = 'limited',
  source = 'https://www.travelks.com/listing/worlds-largest-collection-of-the-worlds-smallest-versions-of-the-worlds-largest-things-roadside-attraction-%26-museum/1709/',
  verified_at = now()
where slug = 'world-s-largest-collection-of-the-world-s-smallest-versions-of-the-world-s-large';

update public.stops set
  description = 'The giant Czech egg is in Wilson, Kansas, not Ellsworth. The project began around 2003, the fiberglass egg arrived in 2012, local artist Christine Slechta and community volunteers painted it over the following years, and it was formally dedicated July 29, 2016; travelers now find the 20-foot hand-painted egg in Shiroky Park.',
  public_access = 'roadside',
  source = 'https://wilsonkschamber.com/worlds-largest-czech-egg/',
  city = 'Wilson',
  state = 'KS',
  verified_at = now()
where slug = 'world-s-largest-czech-egg';

update public.stops set
  description = 'Goodland’s giant easel is part of artist Cameron Cross’s international Van Gogh Project and carries a 24-by-32-foot reproduction of Van Gogh’s “Three Sunflowers in a Vase.” It was installed in Pioneer Park on June 19, 2001 and remains a free roadside artwork visible from Business Highway 24.',
  public_access = 'roadside',
  source = 'https://goodlandks.gov/news/high-plains-museum-news/goodlands-treasures/2011/10/art-in-a-big-way-goodlands-big-easel/',
  verified_at = now()
where slug = 'world-s-largest-easel';

update public.stops set
  description = 'The giant baseball is in Muscotah, not Horton, and was created from a large former water tank as a tribute to Hall of Fame shortstop and Muscotah native Joe Tinker. The local baseball-themed project developed in the 2010s; today the oversized stitched ball sits as a public roadside monument, although the “world’s largest” claim is local rather than a well-documented current record.',
  public_access = 'roadside',
  source = 'https://ksbaseballhof.com/tinker-joe/',
  name = 'Giant Joe Tinker Baseball',
  city = 'Muscotah',
  state = 'KS',
  verified_at = now()
where slug = 'worlds-largest-baseball';

update public.stops set
  description = 'Rumford’s Paul Bunyan is an approximately 18-foot fiberglass Muffler Man that has stood in the area since at least the mid-20th century and was later donated to the town and rebuilt with internal supports. Babe the Blue Ox joined him at the visitor-center site much later, and travelers can photograph the pair for free beside Route 2.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/2556',
  verified_at = now()
where slug = 'paul-bunyan-babe-the-blue-ox';

update public.stops set
  description = 'This enormous lobster trap is a roadside-scale tribute to Maine’s lobster industry in the Addison area. I could not find a reliable published construction year or maker for this specific installation, so the safest description is an oversized local photo stop rather than attaching an unsupported record history to it.',
  public_access = 'roadside',
  source = 'https://www.openstreetmap.org/',
  verified_at = now()
where slug = 'world-s-largest-lobster-trap';

update public.stops set
  description = 'Ironwood’s 52-foot fiberglass Hiawatha statue was built in 1964 as a roadside tourist attraction and local landmark. It has since been refurbished and remains the centerpiece of Hiawatha Park, where travelers can walk up for photos.',
  public_access = 'roadside',
  source = 'https://travelironwood.com/hiawatha-statue/',
  name = 'Hiawatha Statue',
  verified_at = now()
where slug = 'hiawatha-world-s-largest-indian-statue';

update public.stops set
  description = 'This record refers to the concrete Paul Bunyan and Babe the Blue Ox now standing in Ossineke, not Hubbard Lake. Paul N. Domke built the pair in the 1940s; after being moved to a site near Hubbard Lake/Spruce for years, they were returned to their original Ossineke roadside location in 2006, where travelers can see them today.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/2125',
  name = 'Paul Bunyan & Babe the Blue Ox',
  city = 'Ossineke',
  state = 'MI',
  verified_at = now()
where slug = 'paul-bunyan';

update public.stops set
  description = 'Quarry View is a public turnout overlooking the enormous active Calcite limestone quarry outside Rogers City. The quarry began operating in 1911–1912 and a formal visitor overlook was first developed in 1949; today travelers stop at the roadside viewpoint to look into the working mine rather than entering the industrial site itself.',
  public_access = 'roadside',
  source = 'https://www.rogerscity.com/harbor-view.html',
  name = 'Calcite Quarry Viewpoint',
  verified_at = now()
where slug = 'quarry-view';

update public.stops set
  description = 'The Giant Uniroyal Tire began life as a 96-passenger Ferris wheel at the 1964–65 New York World’s Fair. It was moved to Allen Park in 1966 and converted into the stationary 80-foot tire landmark that still towers beside I-94; it is best viewed from public roads and nearby legal stopping points rather than approached directly.',
  public_access = 'roadside',
  source = 'https://www.uniroyaltires.com/auto/news/giant-uniroyal-tire-reaches-60-year-milestone',
  verified_at = now()
where slug = 'uniroyal-tire-world-s-largest-tire';

update public.stops set
  description = 'Traverse City’s giant pie pan is the surviving hardware from the city’s July 25, 1987 attempt to bake the world’s largest cherry pie, which weighed more than 28,000 pounds. The pan remains outdoors as a roadside monument to the event, giving travelers a quick photo stop tied directly to northern Michigan’s cherry industry.',
  public_access = 'roadside',
  source = 'https://sanweb.lib.msu.edu/DMC/MFN/1987/1987-10.pdf',
  verified_at = now()
where slug = 'world-s-largest-cherry-pie-pan';

update public.stops set
  description = 'This is the historic 1887 caboose displayed near the Pine River Depot in Pine River, not Pequot Lakes. Heritage Group North restored the aging railroad car in 2019, and travelers now find it beside the depot as an outdoor piece of local railroad history.',
  public_access = 'roadside',
  source = 'https://www.pineandlakes.com/news/pine-river-pine-ridge-cemetery-historic-caboose-repaired',
  name = 'Pine River Depot 1887 Caboose',
  city = 'Pine River',
  state = 'MN',
  verified_at = now()
where slug = 'historic-caboose';

update public.stops set
  description = 'Blue Earth’s 55-foot Jolly Green Giant was fabricated in 1978 and dedicated that September, becoming a permanent installation in 1979. The fiberglass advertising icon now stands in Giant Statue Park, where travelers can walk up to the pedestal, take photos and visit the surrounding Green Giant-themed displays.',
  public_access = 'roadside',
  source = 'https://www.si.edu/object/jolly-green-giant-sculpture%3Asiris_ari_336561',
  verified_at = now()
where slug = 'jolly-green-giant';

update public.stops set
  description = 'Lucette is in Hackensack, not Walker, and was created as Paul Bunyan’s fictional sweetheart for the town’s 1952 celebration. The statue has been repaired after weather damage over the decades and still stands in Birch Lake Park near the visitor center as a free public landmark.',
  public_access = 'roadside',
  source = 'https://www.hmdb.org/m.asp?m=235099',
  city = 'Hackensack',
  state = 'MN',
  verified_at = now()
where slug = 'lucette-statue-paul-bunyan-s-sweetheart';

update public.stops set
  description = 'Bemidji’s Paul Bunyan and Babe the Blue Ox statues were built in 1937 for the city’s winter carnival and quickly became one of Minnesota’s defining roadside images. They remain beside Lake Bemidji near the visitor center, where travelers can walk up and photograph the historic pair for free.',
  public_access = 'roadside',
  source = 'https://www.exploreminnesota.com/profile/paul-bunyan-babe-blue-ox/1982',
  verified_at = now()
where slug = 'paul-bunyan-and-babe-the-blue-ox-statue';

update public.stops set
  description = 'Paul Bunyan’s “Boat-Anchor” is a 110-ton granite-and-iron monument dedicated in 1958 for Minnesota’s statehood centennial. It sits on a hilltop at the Big Stone County Historical Society Museum grounds in Ortonville, where travelers can view the enormous tongue-in-cheek Bunyan relic and the surrounding lake country.',
  public_access = 'roadside',
  source = 'https://www.hmdb.org/m.asp?m=101378',
  verified_at = now()
where slug = 'paul-bunyan-s-boat-anchor';

update public.stops set
  description = 'This famous ball is in Darwin, not Dassel. Francis A. Johnson wound sisal twine continuously from 1950 until 1979, creating a 17,400-pound ball later protected inside a glass gazebo; travelers can see it from outside at any time and visit the adjacent museum when it is open.',
  public_access = 'roadside',
  source = 'https://www.darwintwineball.com/twineball.html',
  city = 'Darwin',
  state = 'MN',
  verified_at = now()
where slug = 'world-s-largest-ball-of-twine-made-by-one-man';

update public.stops set
  description = 'Olivia’s 25-foot fiberglass corn cob stands in Memorial Park as a playful symbol of the community’s official “Corn Capital of the World” identity. The exact installation year is not clearly documented in current reliable sources, but the cob remains an easy public park photo stop along Highway 212.',
  public_access = 'roadside',
  source = 'https://www.cbsnews.com/minnesota/news/best-roadside-attractions-in-minnesota-part-2/',
  verified_at = now()
where slug = 'world-s-largest-corn-cob';

update public.stops set
  description = 'The giant tiger muskie is actually in Nevis, just east of Park Rapids. The community erected the fish in 1949 as a tourism symbol for its lake country, and today the oversized muskie remains a public landmark near the center of town and the Heartland Trail.',
  public_access = 'roadside',
  source = 'https://cityofnevismn.gov/',
  name = 'World''s Largest Tiger Muskie',
  city = 'Nevis',
  state = 'MN',
  verified_at = now()
where slug = 'world-s-largest-tiger-muskie';

update public.stops set
  description = 'Frazee’s current giant turkey, Big Tom II, was installed on September 19, 1998 after the original statue accidentally burned while workers were removing it. The fiberglass bird stands more than 20 feet tall in Lions Park and remains a free roadside photo stop overlooking the entrance to town.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/2130',
  verified_at = now()
where slug = 'world-s-largest-turkey';

update public.stops set
  description = 'An oversized bluebird sculpture is mapped in Polk County, Minnesota, but the current map data places it in Woodside Township rather than clearly inside Fosston. I could not find a dependable published construction date or record history, so it is best described simply as a giant roadside bird sculpture until the exact local provenance can be confirmed.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N8832130003'
where slug = 'worlds-largest-bluebird';

update public.stops set
  description = 'Maxie is in Sumner, not Brookfield. Sculptor David Jackson built the 40-foot-tall, 62-foot-wingspan Canada goose in 1974 and it was formally dedicated October 30, 1975; today the fiberglass-and-steel bird stands in a public park and can pivot with the wind.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/7248',
  city = 'Sumner',
  state = 'MO',
  verified_at = now()
where slug = 'maxie-the-world-s-largest-goose';

update public.stops set
  description = 'The giant fork is in Springfield, not Battlefield. Noble & Associates created the 35-foot, roughly 11-ton stainless-steel fork in 1990 for a restaurant, and after the restaurant closed it was moved to its current office-property setting at 2215 W. Chesterfield Street; visitors can pull in for a quick photo.',
  public_access = 'roadside',
  source = 'https://www.springfieldmo.org/blog/post/visit-these-fun-quirky-locations-around-springfield/',
  city = 'Springfield',
  state = 'MO',
  verified_at = now()
where slug = 'world-s-largest-fork';

update public.stops set
  description = 'This 42-foot steel chair was erected at Fanning on April 1, 2008 and once held the Guinness title for the world’s largest rocking chair. Casey, Illinois later surpassed it, and it was repainted red and renamed the Route 66 Rocker; travelers still find it beside old Route 66 west of Cuba as a free roadside landmark.',
  public_access = 'roadside',
  source = 'https://www.visitmo.com/things-to-do/route-66-red-rocker',
  name = 'Route 66 Red Rocker',
  verified_at = now()
where slug = 'world-s-largest-rocker';

update public.stops set
  description = 'Thomasville’s current Big Chair was erected in 1950 as a steel-and-concrete replacement for an earlier wooden giant chair built in 1922. The 30-foot landmark stands in the downtown Town Common and continues to symbolize Thomasville’s long furniture-manufacturing history.',
  public_access = 'roadside',
  source = 'https://files.nc.gov/ncdcr/nr/DV0696.pdf',
  verified_at = now()
where slug = 'the-big-chair';

update public.stops set
  description = 'High Point’s oversized furniture landmark began in 1926 as a giant “Bureau of Information” promoting the city’s furniture industry. It was completely redesigned in 1996 into the present 38-foot chest of drawers with giant socks hanging out, and travelers can still view and photograph the exterior from the surrounding streets.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/2148',
  verified_at = now()
where slug = 'world-s-largest-chest-of-drawers';

update public.stops set
  description = 'Jamestown’s 26-foot, 60-ton concrete buffalo was created by sculptor Elmer Petersen in 1959 and received the name Dakota Thunder in a public contest in 2010. It still overlooks the Frontier Village and is open year-round as a free-will-donation public attraction.',
  public_access = 'roadside',
  source = 'https://discoverjamestownnd.com/fun-things-to-do-in-jamestown-nd/all-things-buffalo/worlds-largest-buffalo-monument/',
  verified_at = now()
where slug = 'world-s-largest-buffalo';

update public.stops set
  description = '“Sandy,” Steele’s 40-foot metal sandhill crane, was built in 1998–99 by self-taught ironworker James Miller. The bird stands in a landscaped area just off I-94 and remains an easy roadside stop celebrating the large crane migrations through central North Dakota.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/1834',
  verified_at = now()
where slug = 'world-s-largest-sandhill-crane';

update public.stops set
  description = 'Artist Jim Reinders and about 35 family members built Carhenge in the summer of 1987 as a memorial to Reinders’ father. Thirty-eight gray-painted American cars recreate the scale and arrangement of Stonehenge, and today visitors can freely walk the outdoor site and see additional automobile sculptures in the surrounding Car Art Reserve.',
  public_access = 'roadside',
  source = 'https://history.nebraska.gov/carhenge/',
  verified_at = now()
where slug = 'carhenge';

update public.stops set
  description = 'The Paul Bunyan Tree was a famously massive old tree in the University of New Hampshire’s College Woods, estimated to be more than two centuries old rather than something “built.” Current map data identifies the individual tree as deceased, so a traveler should not expect to find the living giant that originally earned the nickname.',
  public_access = 'closed',
  source = 'https://mapcarta.com/N2581720749',
  verified_at = now()
where slug = 'paul-bunyan-tree';

update public.stops set
  description = 'This oversized shopping-cart sculpture is mapped in Maurice River Township in Cumberland County, closer to the Laurel Lake/Port Elizabeth area than to a formal town center. I could not find a reliable published maker or construction date, so the defensible OddWay description is a large roadside cart installation that can be viewed from the road, not a documented Guinness attraction.',
  public_access = 'roadside',
  source = 'https://www.openstreetmap.org/'
where slug = 'worlds-largest-shopping-cart';

update public.stops set
  description = 'Las Cruces’ giant concrete chile pepper was built in 2010–2011 by the owners of the Big Chile Inn as a deliberately oversized symbol of southern New Mexico’s chile culture. The 47-foot sculpture remains outside the motel property and is an easy roadside photo stop.',
  public_access = 'roadside',
  source = 'https://lascrucesdirectory.com/places/worlds-largest-chili-pepper',
  verified_at = now()
where slug = 'world-s-largest-chile-pepper';

update public.stops set
  description = 'Jamestown’s giant chair is the Iconic Jamestown Chair, a public-art tribute to the city’s once-dominant furniture industry. Fancher Chair Co. built the oversized oak club chair from a historic Jamestown Lounge Company design and installed it downtown in July 2019; it remains a public photo spot at West Third and Lafayette streets.',
  public_access = 'roadside',
  source = 'https://www.jamestownrenaissance.org/installation-of-oversized-chair-honors-jamestowns-history/',
  name = 'The Iconic Jamestown Chair',
  verified_at = now()
where slug = 'big-chair';

update public.stops set
  description = 'The Kaatskill Kaleidoscope is a roughly 60-foot silo converted into an immersive walk-in kaleidoscope at the Emerson Resort in Mount Tremper, not Shokan proper. It opened in 1996, and visitors today buy admission to stand inside while projected imagery and sound transform the silo interior.',
  public_access = 'limited',
  source = 'https://emersonresort.com/worlds-largest-kaleidoscope/',
  name = 'Kaatskill Kaleidoscope',
  city = 'Mount Tremper',
  state = 'NY',
  verified_at = now()
where slug = 'world-s-largest-kaleidoscope';

update public.stops set
  description = 'Longaberger built this huge apple-filled basket at its Homestead property in 1999 as another supersized expression of the company’s basket-making identity. The commercial village later closed and the property became restricted; the basket was repainted in 2022 and is still visible, but travelers should remain on public/access roads and respect barriers and no-trespassing signs.',
  public_access = 'private',
  source = 'https://www.roadsideamerica.com/tip/2586',
  verified_at = now()
where slug = 'world-s-largest-apple-basket';

update public.stops set
  description = 'Dresden’s giant Longaberger Market Basket was built from hardwood maple and dedicated in 1980. Measuring 48 feet long, 11 feet wide and 23 feet high, it still stands at Fifth and Main streets as a free downtown photo stop tied to the town’s basket-making history.',
  public_access = 'roadside',
  source = 'https://destinationdresden.com/worlds-largest-basket/',
  verified_at = now()
where slug = 'world-s-largest-basket';

update public.stops set
  description = 'This giant animated clock was built in 1972 for the Alpine-Alpa restaurant near Wilmot and later donated to Sugarcreek. It was moved and restored downtown in 2012, where travelers can still watch its cuckoo bird, mechanical band and dancing figures perform on a regular schedule.',
  public_access = 'roadside',
  source = 'https://visitsugarcreek.com/',
  verified_at = now()
where slug = 'world-s-largest-cuckoo-clock';

update public.stops set
  description = 'Warren’s giant drumsticks were carved from two roughly 23-foot poplar logs by local artist Joel Eggert and installed as part of Dave Grohl Alley in 2013. They remain outdoors with murals and other Grohl-themed artwork celebrating the Foo Fighters frontman’s Warren birthplace.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/32170',
  verified_at = now()
where slug = 'world-s-largest-drumsticks';

update public.stops set
  description = 'The giant fiberglass-and-foam horseshoe crab that once stood near Hillsboro is no longer in Ohio. Built in the 1990s for a Baltimore Inner Harbor display, it later moved through Kentucky and Ohio before being donated to Dinosaur Adventure Land near Lenox, Alabama by 2021; the old Hillsboro location no longer contains the sculpture.',
  public_access = 'open',
  source = 'https://en.wikipedia.org/wiki/World%27s_Largest_Horseshoe_Crab_%28Hillsboro%2C_Ohio%29',
  city = 'Lenox',
  state = 'AL',
  verified_at = now()
where slug = 'world-s-largest-horseshoe-crab';

update public.stops set
  description = 'Durant’s molded-aluminum peanut monument was dedicated on November 15, 1974 to Bryan County’s peanut growers and processors. Although larger peanut sculptures now exist elsewhere, the original local claim remains on the monument, which sits on the City Hall lawn and is viewable 24 hours a day.',
  public_access = 'roadside',
  source = 'https://www.travelok.com/listings/view.profile/id.22732',
  name = 'Durant Giant Peanut',
  verified_at = now()
where slug = 'world-s-largest-peanut';

update public.stops set
  description = 'This is a natural giant sugar pine in the southern Oregon forest rather than a man-made attraction, so there is no construction date; the famous tree is several centuries old. The Jackson Creek-area specimen long carried a “world’s tallest” reputation but newer measurements have identified taller living sugar pines elsewhere, and reaching this one requires forest roads and a woodland approach rather than a simple highway pull-off.',
  public_access = 'limited',
  source = 'https://conifers.org/pi/Pinus_lambertiana.php',
  name = 'Jackson Creek Giant Sugar Pine',
  verified_at = now()
where slug = 'world-s-tallest-sugarpine';

update public.stops set
  description = 'Summerville created a giant batch of sweet tea on June 10, 2016, filling a custom oversized Mason jar with more than 2,500 gallons to set a Guinness record. The permanent jar remains near Town Hall as a roadside monument to the record attempt and the town’s claim as the birthplace of sweet tea.',
  public_access = 'roadside',
  source = 'https://www.visitsummerville.com/sweet-tea/',
  verified_at = now()
where slug = 'world-s-largest-sweet-tea';

update public.stops set
  description = 'Huron’s enormous pheasant was built in 1959 as a tribute to South Dakota’s celebrated pheasant-hunting culture. The roughly 28-foot-tall bird still stands beside U.S. Highway 14 on the east side of town, where travelers can pull off for photos.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/tip/3320',
  verified_at = now()
where slug = 'world-s-largest-pheasant';

update public.stops set
  description = 'The Ant Farm art collective created Cadillac Ranch in 1974 for Amarillo millionaire Stanley Marsh 3, burying ten Cadillacs nose-first in a field at matching angles. The installation was moved west in 1997 as Amarillo expanded, and today it remains free to visit, with travelers walking out into the field and commonly adding their own spray paint.',
  public_access = 'roadside',
  source = 'https://www.visitamarillo.com/listing/cadillac-ranch/595/',
  verified_at = now()
where slug = 'cadillac-ranch';

update public.stops set
  description = 'Jim Love created “Paul Bunyan Bouquet No. 2” in 1968, turning heavy industrial forms into a whimsical monumental bouquet. The sculpture is on the Rice University campus in Houston rather than West University Place, and travelers can see it as part of the university’s outdoor public-art collection.',
  public_access = 'roadside',
  source = 'https://publicart.rice.edu/artworks/paul-bunyan-bouquet-no-2',
  city = 'Houston',
  state = 'TX',
  verified_at = now()
where slug = 'paul-bunyan-bouquet-no-2';

update public.stops set
  description = 'Bowie’s enormous steel knife was created as a civic landmark and earned Guinness recognition in April 2016. The 20-foot sculpture remains at the south entrance to town as a free roadside photo stop celebrating both the city name and the famous Bowie knife.',
  public_access = 'roadside',
  source = 'https://cityofbowietx.com/384/Worlds-Largest-Bowie-Knife',
  verified_at = now()
where slug = 'world-s-largest-bowie-knife';

update public.stops set
  description = 'These are Bob “Daddy-O” Wade’s “The Giant Justins,” created in 1979 for the Washington Project for the Arts. The 40-foot boots moved permanently to North Star Mall in San Antonio in 1980, where they remain an easy exterior photo stop and one of the city’s best-known pieces of oversized public art.',
  public_access = 'roadside',
  source = 'https://www.northstarmall.com/en/events/39974/',
  name = 'The Giant Justins',
  city = 'San Antonio',
  state = 'TX',
  verified_at = now()
where slug = 'world-s-largest-cowboy-boots';

update public.stops set
  description = 'The giant pecan associated with this record is at the Texas Agricultural Education & Heritage Center in Seguin, not Geronimo. Seguin unveiled the 16-foot-long fiberglass pecan in 2011 to regain a “world’s largest” title, although a still larger Texas pecan surpassed it in 2025; travelers can see the monument on the Big Red Barn grounds during public access.',
  public_access = 'limited',
  source = 'https://www.roadsideamerica.com/tip/33385',
  name = 'Seguin Giant Pecan',
  city = 'Seguin',
  state = 'TX',
  verified_at = now()
where slug = 'world-s-largest-pecan';

update public.stops set
  description = 'Lampasas’ giant spur was forged by ironsmith Waylon Dobbs for local businesswoman Leah Caruthers and installed on March 14, 2016. The roughly 35-foot steel, copper and iron sculpture earned Guinness recognition and remains visible from U.S. 281 with parking available for photos.',
  public_access = 'roadside',
  source = 'https://www.lampasas.org/m/newsflash/home/detail/432',
  verified_at = now()
where slug = 'world-s-largest-spur';

update public.stops set
  description = 'Paul Bunyan’s Woodpile is a natural geologic formation of columnar volcanic rock, not a man-made Bunyan prop. The “logs” formed roughly 30 million years ago, and travelers reach them on BLM land by driving about 3.5 miles on a dirt road and then hiking roughly one mile to the formation.',
  public_access = 'limited',
  source = 'https://www.blm.gov/visit/paul-bunyons-woodpile',
  verified_at = now()
where slug = 'paul-bunyan-s-woodpile';

update public.stops set
  description = 'This viewpoint looks across the same Paul Bunyan’s Woodpile geologic formation rather than being a separate constructed attraction. The volcanic columns formed about 30 million years ago, and reaching the overlook involves the same rough BLM access road and hiking route used for the Woodpile itself.',
  public_access = 'limited',
  source = 'https://www.blm.gov/visit/paul-bunyons-woodpile',
  verified_at = now()
where slug = 'paul-bunyan-s-woodpile-overlook';

update public.stops set
  description = 'Winchester’s giant red apple began as a parade float for the Shenandoah Apple Blossom Festival before being permanently placed on the lawn of the historic Sheridan’s Headquarters property. The exact fabrication year is not clearly documented in current sources, but the apple has become a longstanding symbol of the region’s orchard industry and remains visible from the downtown street.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/4032',
  verified_at = now()
where slug = 'world-s-largest-apple';

update public.stops set
  description = 'Burlington artist Bren Alvarez created “File Under So. Co., Waiting for…” in 2002 from stacked filing cabinets as a joke about decades of paperwork surrounding the long-delayed Southern Connector highway. The sculpture was moved and revised in 2020 and now stands at an art park outside 208 Flynn Avenue, where visitors can view it freely from the public-facing site.',
  public_access = 'roadside',
  source = 'https://www.burlingtoncityarts.org/so-co-file-under',
  verified_at = now()
where slug = 'world-s-tallest-filing-cabinet';

update public.stops set
  description = 'Bellingham artist David Ireland created “Bigger Big Chair” in 2004–06 as a monumental painted-steel version of an ordinary club chair. The 12.5-foot sculpture belongs to Western Washington University’s outdoor art collection and remains publicly viewable on campus.',
  public_access = 'roadside',
  source = 'https://westerngallery.wwu.edu/david-ireland-bigger-big-chair-2004-06',
  name = 'Bigger Big Chair by David Ireland',
  verified_at = now()
where slug = 'bigger-big-chair';

update public.stops set
  description = 'This oversized chair is in Neah Bay, not Forks, and is mapped near the Makah Museum/harbor area as a local roadside attraction. I could not locate a reliable artist or construction date in current published sources, so OddWay should keep the history minimal and present it simply as a giant chair photo stop.',
  public_access = 'roadside',
  source = 'https://mapcarta.com/N12247217710',
  city = 'Neah Bay',
  state = 'WA'
where slug = 'neah-bay-big-chair';

update public.stops set
  description = 'Long Beach’s giant frying pan was commissioned by the local chamber of commerce and forged in 1941 for the town’s Razor Clam Festival. It has since been surpassed by larger pans elsewhere, but the 14-foot-long landmark remains a free downtown roadside photo stop and one of the classic oddities of the Washington coast.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/2972',
  verified_at = now()
where slug = 'world-s-biggest-frying-pan';

update public.stops set
  description = 'Winlock’s giant egg tradition began in 1923 when the first oversized egg was built for a parade celebrating the Pacific Highway bridge and the local poultry industry. Several replacements followed as earlier versions deteriorated, and today a later fiberglass incarnation stands in Vern Zander Memorial Park as the town’s signature roadside landmark.',
  public_access = 'roadside',
  source = 'https://en.wikipedia.org/wiki/Winlock_Egg',
  verified_at = now()
where slug = 'world-s-largest-egg';

update public.stops set
  description = 'South Bend’s giant oyster is a concrete shell monument celebrating the Willapa Bay oyster industry and sits in Robert Bush Memorial Park. The exact installation year is not well documented in reliable current sources, but travelers today can walk up to the oversized shell in the public riverfront park.',
  public_access = 'roadside',
  source = 'https://www.atlasobscura.com/places/the-world-s-largest-oyster',
  verified_at = now()
where slug = 'world-s-largest-oyster';

update public.stops set
  description = 'This is the Quinault Big Sitka Spruce near Lake Quinault, not in Hoquiam itself. The natural tree is roughly 191 feet tall with a circumference approaching 59 feet and is estimated to be around a thousand years old; travelers reach it on a short trail managed from the Rain Forest Resort Village area.',
  public_access = 'roadside',
  source = 'https://www.nps.gov/places/000/quinault-big-sitka-spruce-tree.htm',
  name = 'Quinault Big Sitka Spruce',
  city = 'Quinault',
  state = 'WA',
  verified_at = now()
where slug = 'world-s-largest-spruce';

update public.stops set
  description = 'Woodruff’s giant concrete penny commemorates the 1953 “Million Penny Parade,” when local schoolchildren and supporters collected more than a million cents to help fund a hospital. The monument was dedicated May 29, 1954 and remains beside the road as a permanent tribute to the campaign.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/2255',
  verified_at = now()
where slug = 'world-s-largest-penny';

update public.stops set
  description = 'Plover installed its nearly 39-foot, roughly three-ton potato masher on May 19, 2023 outside the Food + Farm Exploration Center. The giant utensil was designed specifically as a selfie landmark celebrating central Wisconsin agriculture, and travelers can photograph the exterior sculpture even if they are not touring the center.',
  public_access = 'roadside',
  source = 'https://spmetrowire.com/potd-the-worlds-largest-potato-masher/',
  verified_at = now()
where slug = 'world-s-largest-potato-masher';

update public.stops set
  description = 'Marshfield’s enormous round barn was built in 1916 to house purebred livestock and measures about 150 feet across and 70 feet high. It still serves its original agricultural purpose during the Central Wisconsin State Fair, while interior tours outside events require advance arrangement with the fair office.',
  public_access = 'limited',
  source = 'https://visitmarshfield.com/business/worlds-largest-round-barn/',
  verified_at = now()
where slug = 'world-s-largest-round-barn';

update public.stops set
  description = 'La Crosse’s “six-pack” is actually six 54-foot beer storage tanks built by G. Heileman Brewing Company in 1969 and painted as giant Old Style cans in 1970. The working brewery tanks have changed branding several times and returned to Old Style imagery in 2023; travelers view them from the surrounding public streets rather than touring the industrial tanks themselves.',
  public_access = 'roadside',
  source = 'https://wi101.wisc.edu/object-history-worlds-largest-six-pack/',
  verified_at = now()
where slug = 'world-s-largest-six-pack';

update public.stops set
  description = 'Richwood’s giant lumberjack is a modified fiberglass Muffler Man used as the Richwood High School Lumberjacks mascot beside the football field. Roadside America was tracking the figure in Richwood by 1990, though its original manufacture date is not documented; it has been repaired and repainted repeatedly and is best viewed from permitted public areas around school events.',
  public_access = 'limited',
  source = 'https://www.roadsideamerica.com/tip/2832',
  name = 'Richwood Lumberjack Muffler Man',
  verified_at = now()
where slug = 'lumberjack-muffler-man-statue';

update public.stops set
  description = 'Chester’s giant teapot began as an oversized Hires Root Beer keg before William “Babe” Devon bought it in 1938, added a handle, spout and lid, and turned it into a teapot-shaped concession stand promoting the region’s pottery industry. Restored and relocated over the years, it now stands on a landscaped roadside site as one of West Virginia’s classic oversized attractions.',
  public_access = 'roadside',
  source = 'https://www.roadsideamerica.com/story/11259',
  verified_at = now()
where slug = 'world-s-largest-teapot';

update public.stops set
  description = 'The Big Spring at Hot Springs State Park is a natural geothermal feature rather than something built, with hot mineral water feeding the terraces and bathhouse system at Thermopolis. An 1897 agreement reserved part of the spring water for free public bathing, and travelers today can view the spring from boardwalks and use the park’s free bathhouse during posted hours.',
  public_access = 'roadside',
  source = 'https://npgallery.nps.gov/GetAsset/0c2763ad-9455-4707-9804-b3b07b7587c9',
  verified_at = now()
where slug = 'world-s-largest-mineral-hot-spring';
