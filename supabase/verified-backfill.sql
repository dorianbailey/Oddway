-- Backfill verified_at on the 1,095 stops imported tonight.
--
-- Every state file before tonight set this column. scripts/import-state.mts
-- did not, because when it was written it was not certain the column existed
-- and leaving it out seemed safer than guessing. It was not safer: the about
-- page reads the count of rows where it is null and says
--
--   "{n} entries say plainly that we could not verify them."
--
-- That number was 25 before tonight. It is now 1,120, and 1,095 of those are
-- stops that were researched, sourced, and checked against three duplicate
-- passes to exactly the standard the other forty states were held to. The page
-- is currently making a claim about them that is not true.
--
-- app/sitemap.ts also drops unverified stops to priority 0.5 with no
-- lastModified date, so the newest work in the index is the lowest-ranked.
--
-- The twenty-five listed below stay null, and should. They are the genuine
-- unverified remainder: OpenStreetMap scan rows with placeholder names like
-- "abandoned mine marker" and "Ghost Town", the Centralia row that has no
-- source at all, and a handful whose research was inconclusive. Their pages
-- saying so is the whole point of the column.

begin;

update public.stops
set verified_at = now()
where verified_at is null
  and slug not in (
    'abandoned-mine-marker',
    'alien',
    'belcamp-ghost-town',
    'bigfoot-2',
    'centralia',
    'chaos-haunted-house',
    'doctor-morbid-s-haunted-house',
    'ghost-town',
    'ghost-town-2',
    'giant-ball',
    'gilbert-ghost-town',
    'haunted-tales',
    'hodag',
    'lover-s-leap-lookout',
    'martin-augustine-mining-camp',
    'neah-bay-big-chair',
    'penitentiary-avenue',
    'sasquatch',
    'sasquatch-2',
    'smiley-face-water-tower',
    'spencer-s-mining-camp',
    'the-fear-factory',
    'worlds-largest-bluebird',
    'worlds-largest-shopping-cart',
    'yolo-the-jackalope'
  );

commit;

-- Afterwards this must return 25.
select count(*) as still_unverified from public.stops where verified_at is null;
