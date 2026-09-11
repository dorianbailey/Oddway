-- Three clusters that looked like coordinate problems. Only one was.
--
-- Expected afterwards: 7096 - 1 = 7095.
--   select count(*) from public.stops;   -- 7095

begin;

-- ------------------------------------------------------------ Bartlesville
/*
  Two entries, 705 m apart, for one gravity hill.

  The Bartlesville Examiner-Enterprise is unambiguous: "Gravity Hill is located
  south of Bartlesville where Gap and Moose Lodge roads meet." One hill at one
  junction, entered twice under the name of each road that reaches it — which
  is why neither the slug check nor the proximity check could see it. The names
  share no words and 705 m reads as two different places.

  The survivor keeps the better name and a Green Country Oklahoma listing. The
  deleted row cited a news article, which will rot sooner.
*/
delete from public.stops where slug = 'moose-lodge-gravity-hill-bartlesville-ok';

-- ------------------------------------------------------------ Willow Creek
/*
  Three Bigfoot statues within 330 m, and all three are real. SFGATE, visiting
  in 2023: one outside Gonzalez Mexican Restaurant, another in front of the
  Chevron, and Jim McClarin's 1967 redwood "Oh-Mah" carving at the junction of
  299 and 96. Willow Creek calls itself the Bigfoot Capital of the World and
  behaves accordingly. No merge.

  But one of them held the slug "bigfoot-statue" outright — generic enough that
  the next Bigfoot statue researched anywhere in the country would have
  collided with it. It now carries its town, the same rule the index uses for
  every other contested name.
*/
update public.stops
set name = 'Bigfoot Statue — Willow Creek',
    slug = 'bigfoot-statue-willow-creek'
where slug = 'bigfoot-statue';

/*
  While here: the Gonzalez statue cited mapcarta.com, which is an OpenStreetMap
  scrape and a competing guide, and says nothing about the statue. SFGATE names
  it directly.
*/
update public.stops
set source = 'https://www.sfgate.com/travel/article/willow-creek-norcal-town-obsessed-with-bigfoot-18410299.php'
where slug = 'gonzalez-bigfoot-statue';

commit;

select count(*) as total_should_be_7095 from public.stops;

-- --------------------------------------------------------------- Ellinwood
--
-- No change, and the reason is worth recording.
--
-- Ellinwood Underground Tunnels and the Historic Wolf Hotel sit at identical
-- coordinates to six decimal places, which looks exactly like a copied pin.
-- It is not. The tunnels run beneath the hotel and the tour is entered through
-- it: the Kansas Sampler listing gives the tour address as "1 N. Main,
-- Historic Wolf Hotel", and a visitor tip on the matter is blunter — "There
-- aren't visible stairs from the street. You have to go into the Wolf Hotel to
-- get to the Underground."
--
-- Two stops at one address, because they are at one address. Moving either pin
-- would make the map tidier and the data wrong.
--
-- One thing that may need checking on the ground: more recent accounts say the
-- tour now starts at the Ellinwood Emporium and that the open section is the
-- one under the Dick Building rather than under the hotel. The sources
-- conflict and none is dated clearly enough to settle it, so nothing has been
-- changed on the strength of it.
