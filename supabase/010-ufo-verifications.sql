-- Resolving the two UFO entries that could not be identified at import time.
--
-- Both turned out to be something other than their OSM name suggested, which
-- is why they went in unverified rather than being described speculatively.

-- Alien-themed decor at a roller rink, not a museum. Somebody driving to Santa
-- Fe expecting a museum would be misled, so the description says so.
update public.stops set
  name          = 'Alien Museum at Rockin'' Rollers',
  description   = 'Mapped as the Alien Museum, this shares an address with Rockin'' Rollers Event Arena, a long-running roller rink known for its extensive alien-themed decor. There is no separate museum with its own hours — you see the extraterrestrial displays by turning up to a public skating session or an event.',
  public_access = 'limited',
  source        = 'https://www.santafe.org/things-to-do/family-activities/',
  verified_at   = now()
where slug = 'alien-museum';

-- A genuine work in a permanent collection, and not UFO history: a sculpture
-- that happens to be saucer-shaped belongs with the roadside oddities.
update public.stops set
  name          = 'Flying Saucer by Jene Highstein',
  category      = 'roadside-oddities',
  description   = 'A 1977 sculpture by Jene Highstein: concrete over a steel frame, a dark oval sitting in the prairie grass like something that landed and settled. It is part of the permanent collection at Governors State University''s Nathan Manilow Sculpture Park, which is free, has free parking, and is open dawn to dusk every day of the year. Walk out to it — just don''t climb on it.',
  public_access = 'open',
  source        = 'https://www.govst.edu/theNate',
  verified_at   = now()
where slug = 'flying-saucer-university-park';
