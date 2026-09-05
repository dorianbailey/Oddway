-- Venue timezone, required to evaluate opening hours correctly.
--
-- Without this, "Open now" would be computed against the visitor's clock,
-- telling someone in California that a West Virginia museum is open three
-- hours after it shut. Populate from coordinates at import time.

alter table public.stops
  add column if not exists timezone text;

update public.stops
  set timezone = 'America/New_York'
  where timezone is null and state in ('WV', 'PA');
