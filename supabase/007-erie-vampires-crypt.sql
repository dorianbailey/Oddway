-- The Vampire's Crypt, Erie Cemetery. Added by hand.
--
-- The OSM importer could never find this: OpenStreetMap records that Erie
-- Cemetery is a cemetery, not that one of its mausoleums has a vampire legend
-- attached. Local knowledge is the only source for entries like this.
--
-- Coordinates are the cemetery centroid from OSM way/837633430, not the crypt
-- itself — enough to route someone to the gates; the tomb is found on foot.

insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description,
   public_access, source, timezone, verified_at)
values (
  'The Vampire''s Crypt',
  'the-vampires-crypt-erie',
  'folklore',
  42.11081,
  -80.08638,
  'Erie',
  'PA',
  'A plain marble mausoleum in Erie Cemetery whose family name was chiselled off the lintel long ago, leaving a mark that reads as a V — which is all it took for the city to decide a vampire was inside. The vault is recorded to Gertrude Brown, though nobody of that name lies in it; the first burial was G. W. Goodrich in November 1884, and around seven people were interred over the years, most of them Goodriches. The cemetery dates to 1851 and is still in use, so visit as you would any burial ground: on foot, in daylight, quietly.',
  'roadside',
  'https://www.openstreetmap.org/way/837633430',
  'America/New_York',
  now()
)
on conflict (slug) do update set
  description   = excluded.description,
  latitude      = excluded.latitude,
  longitude     = excluded.longitude,
  public_access = excluded.public_access,
  source        = excluded.source,
  verified_at   = excluded.verified_at;
