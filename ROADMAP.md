# OddWay roadmap

Not a backlog of everything imaginable — just the things that have been
decided on, with the reasoning that will otherwise be lost.

## Events

An events page: cryptid festivals, haunted houses, spooky mazes, anything
seasonal. Listed alphabetically, filterable to "near me" with a distance from
the visitor's location and the dates each one runs. Events drop off the list
once they've happened for the year and return for the next one.

**Why it's a separate table, not a category of `stops`.** A stop is a place
that is simply there; an event has dates, and most of the interesting ones are
annual. Bolting dates onto `stops` would mean every query in the app carrying a
"is this a place or an occurrence" branch. Sketch:

```
events
  id, name, slug
  stop_id      -- nullable FK; many events happen at a stop we already index
  latitude, longitude, city, state, timezone   -- when there's no stop
  description, website, source, verified_at
  recurrence   -- see below
```

**Recurrence is the hard part, and it is not "same date next year."** Most of
these are patterns: "the first three weekends of October", "the Saturday
nearest Halloween", "Mothman Festival, third weekend in September". Storing a
fixed date and adding 365 days produces wrong answers within two years.

Two workable options:

1. Store confirmed date ranges per year, and require a human to add next
   year's. Honest, no drift, but needs annual upkeep.
2. Store a pattern (nth weekday of month) plus confirmed overrides.

Option 1 is probably right to start with. An event listed on the wrong weekend
is worse than an event not listed at all — someone drives four hours to an
empty field.

**Sourcing is the real obstacle, and it is unsolved.** OpenStreetMap has almost
no event data; it maps things that persist. Scraping event aggregators is
ruled out. That leaves organiser websites and manual entry, which means the
events list will grow slowly and by hand. Worth knowing before the schema work
starts, because the schema is the easy half.

**Filtering.** "Near me" reuses the geolocation and distance code already in
`lib/trip-order.ts`. Alphabetical and by-distance are two sort modes over one
list, not two pages.

**Dormant events.** Not deleted. A Facebook page that has gone quiet does not
reliably mean the festival stopped — many are run through a county visitor
centre rather than their own account. The listing links to whatever page exists
and tells people to confirm before travelling. If this becomes a real problem,
a `status` column (active / dormant) would hide them without discarding the
research.

**Past events.** Hide rather than delete. A festival that ran last October is
evidence it will likely run again, and deleting it throws away the research.

## Filming locations

A category for places where horror and other frightening films were shot: the
house, the motel, the stretch of road. Distinct from the rest of the index in
that the interest is entirely borrowed — the building is often unremarkable
until you know what happened there on screen.

**The import pipeline will not find these.** OpenStreetMap almost never records
what was filmed somewhere; it maps what a thing *is*, not what it appeared in.
A keyword scan would return nothing. Wikidata is the plausible source — it has
a `filming location` property linking films to places — and Wikipedia articles
often name locations in prose. Both would need a different importer to the
Overpass one.

**Two cautions.**

Many are private homes. People live in the house from a famous horror film and
did not sign up for visitors. Anything residential needs `private` access and a
description that says plainly to look from the road and go no further; some
should probably not be listed at all.

Naming films is fine — a factual statement that a film was shot somewhere
carries no rights issue — but stills, posters and dialogue are another matter
and should stay off the site.

**Needs** a new `filming-locations` value in the `stop_category` enum, an entry
in `lib/categories.ts`, and a Wikidata-based importer.

## Data

- **Descriptions.** Every imported stop has an empty description and
  `verified_at` null. The index isn't trustworthy until these are written by
  hand, with sources.
- **Widening the import keywords.** The current lists are deliberately narrow.
  A Bigfoot statue named "Harry" and tagged only `tourism=artwork` won't match.
  Widen once the false-positive rate on the current lists is known.
- **Remaining categories.** `folklore`, `weird-history` and `museums` have no
  import searches defined yet.

## Product

- **Directions caching.** Each directions request costs an OpenRouteService
  call on top of the three a trip search already uses. Repeat origin and
  destination pairs are not cached.
- **Holiday closures.** `lib/opening-hours.ts` parses weekly rules but not
  `Dec 25 off`, `easter off` or `Nov Th[4] off`. The badge softens its claim
  when it sees one it can't evaluate; making it exact needs a US holiday
  calendar.
- **Deployment.** Not yet on Vercel.
