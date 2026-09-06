-- Theme park rides removed from the index.
--
-- All three are attractions behind park admission rather than places you can
-- pull off a road to see, which is the line this index draws. The Wisconsin
-- Dells Haunted Mansion is an independent attraction and stays.
--
-- These are deletions rather than `closed` because they are not closed; they
-- simply do not belong. If a future OSM run re-imports them, delete again.

delete from public.stops
where slug in (
  'the-haunted-mansion',        -- Walt Disney World
  'the-haunted-mansion-2',      -- Disneyland
  'flying-saucer-riverside'     -- Gravitron inside Castle Park
);
