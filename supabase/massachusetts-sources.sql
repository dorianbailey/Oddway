-- Official sources for Massachusetts, first pass.
--
-- Only two. That is not laziness, it is the honest result of trying.
--
-- 199 of the 250 Massachusetts stops were credited to Atlas Obscura. Verifying
-- an official site takes a search each, and the search does not always surface
-- one: looking for Hammond Castle and the Lizzie Borden house returned Yelp,
-- Tripadvisor and a tourism board, and no official domain for either. At that
-- point the temptation is to write down a domain that looks plausible, which
-- is how a confidently wrong link gets into an index that people are supposed
-- to trust.
--
-- So these two are verified and the rest are left alone. A credit line reading
-- "Atlas Obscura" is honest; a guessed URL is not.
--
-- The fix is upstream rather than here. New Jersey came back with dep.nj.gov
-- and nps.gov among its top sources because those stops were researched with
-- official pages in mind from the start. Asking for the official site as part
-- of the source line costs nothing at research time and avoids this entirely.

update public.stops set
  source = 'https://www.marybakereddylibrary.org/visit/'
where slug = 'mapparium-globe';

update public.stops set
  source = 'https://7gables.org/'
where slug = 'the-house-of-the-seven-gables';

select
  count(*) filter (where source like '%atlasobscura%') as atlas_obscura,
  count(*) filter (where source like '%roadsideamerica%') as roadside_america,
  count(*) as total
from public.stops
where state = 'MA';
