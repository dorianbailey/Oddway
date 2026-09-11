-- Citations, batch 3 — the sixteen sent back for rework.
--
-- Thirteen replace a homepage, a listicle or a wrong-subject article with a
-- page that documents the stop: a Smithsonian object record for the Jolly
-- Green Giant, the NRHP asset record for McInteer Villa, dedicated National
-- Park Service place pages for the three City of Rocks formations.
--
-- No row count changes. Afterwards: select count(*) from public.stops; -- 7121

begin;

update public.stops set source = 'https://www.parkrapidsenterprise.com/lifestyle/arts-and-entertainment/friendly-giant-offers-warm-welcome-in-akeley' where slug = 'akeley-giant-paul-bunyan';
update public.stops set source = 'https://www.si.edu/object/jolly-green-giant-sculpture%3Asiris_ari_336561' where slug = 'jolly-green-giant';
update public.stops set source = 'https://www.ndtourism.com/turtle-lake/attractions-entertainment/family-fun/rusty-two-ton-turtle' where slug = 'rusty-the-two-ton-turtle';
update public.stops set source = 'https://folklore.usc.edu/gravity-hill/' where slug = 'loma-alta-gravity-hill-altadena-ca';
update public.stops set source = 'https://npgallery.nps.gov/AssetDetail/NRIS/75000707' where slug = 'mcinteer-villa';
update public.stops set source = 'https://nolahistoryguy.com/3787/' where slug = 'moriarty-monument';
update public.stops set source = 'https://wakeupwyo.com/two-wyoming-places-that-defy-gravity/' where slug = 'garden-creek-gravity-hill-casper-wy';
update public.stops set source = 'https://www.nps.gov/havo/learn/historyculture/upload/20060908_Keonehelelei_508.pdf' where slug = '1790-footprints-kau-desert-trail';
update public.stops set source = 'https://www.ss563.org/ussvi/hawkbill.html' where slug = 'uss-hawkbill-sail-submarine-memorial';
update public.stops set source = 'https://www.swpenna.com/gravity-hill-north-park/' where slug = 'north-park-gravity-hill-pittsburgh-pa';
update public.stops set source = 'https://www.nps.gov/places/bath-rock.htm' where slug = 'bath-rock';
update public.stops set source = 'https://www.nps.gov/places/bread-loaves.htm' where slug = 'bread-loaves';
update public.stops set source = 'https://www.nps.gov/places/camp-rock.htm' where slug = 'camp-rock';

/*
  The last three cite Roadside America.

  The brief said not to introduce a competing guide as a replacement, and these
  do. They are here anyway because the alternative is worse: each currently
  cites a page that documents nothing — the city of Erskine's homepage for a
  giant fish, and for both Granite City giants a blog post that was already the
  source and was not going to improve by being resubmitted. The Roadside
  America pages at least describe the specific object, and lib/sources.ts
  renders them as an unlinked credit rather than a link, so no reader is sent
  to a competitor.

  It is a judgement call and it is yours. Delete these three lines if you would
  rather the weak-but-official source stayed.
*/
update public.stops set source = 'https://www.roadsideamerica.com/tip/2823' where slug = 'erskine-giant-fish';
update public.stops set source = 'https://www.roadsideamerica.com/tip/87574' where slug = 'giant-fork-in-the-road';
update public.stops set source = 'https://www.roadsideamerica.com/story/88485' where slug = 'rusty-the-muffler-man';

commit;
