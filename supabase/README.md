# Database files

Run in numbered order against a fresh Postgres to reproduce the live database.
Everything here is idempotent: re-running a file is safe.

| File | What it does |
| --- | --- |
| `schema.sql` | Tables, enums, PostGIS column, indexes, row level security |
| `seed.sql` | The seven original demo stops |
| `migration-002-osm-hours.sql` | OSM identifiers, opening hours, website, phone |
| `migration-003-timezone.sql` | IANA timezone, needed to evaluate opening hours |
| `migration-004-events.sql` | The `events` table |
| `migration-005-suggestions.sql` | The `suggestions` table, write-only for the public |
| `migration-006-geocode-cache.sql` | Shared geocode cache |
| `import-cryptids.sql` | 27 cryptid places from OpenStreetMap |
| `descriptions-cryptids.sql` | Descriptions, access states and sources for those |
| `import-haunted.sql` | 88 haunted and weird-history places |
| `descriptions-haunted.sql` | Descriptions and corrections for those 85 |
| `seed-events.sql` | 34 events |
| `event-coords.sql` | Coordinates and timezones for the events |
| `event-links.sql` | Facebook pages promoted into the website column |
| `gravity-hills.sql` | 41 gravity hills from Wikipedia's sourced list |
| `007-erie-vampires-crypt.sql` | Added by hand; the importer cannot find it |
| `008-remove-theme-park-rides.sql` | Deletes three rides behind park admission |
| `009-ufos-trimmed.sql` | The UFO import, trimmed — use instead of `import-ufos.sql` |
| `010-ufo-verifications.sql` | Resolves two entries that went in unverified |
| `011-demo-stop-sources.sql` | Sources for the seven original demo entries |

## Files that are not run as-is

`import-ufos.sql` is the raw scanner output and still contains theme park
rides. `009-ufos-trimmed.sql` is what was actually applied.

## Conventions

Nothing is deleted for being closed or dormant. A place that has shut, burned
down or become unsafe is marked `public_access = 'closed'` instead, for two
reasons: the research is worth keeping, and a deleted row is simply re-added
the next time the OSM importer runs. Deletion is reserved for things that do
not belong in the index at all.

`verified_at` is null wherever a claim could not be checked against a source.
The stop page says so plainly rather than implying a check that never happened.
