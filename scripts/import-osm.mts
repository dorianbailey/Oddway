/**
 * Import roadside oddities from OpenStreetMap, one category at a time.
 *
 *   npx tsx scripts/import-osm.mts cryptids
 *   npx tsx scripts/import-osm.mts haunted --tile 3
 *
 * Writes supabase/import-<category>.sql for you to read before running it.
 * Nothing touches the database automatically: an import that inserts a
 * thousand rows unreviewed is how an index becomes untrustworthy.
 *
 * Resumable. Progress is checkpointed per tile in .import-cache/, so a run
 * interrupted at tile 140 of 185 picks up at 140 rather than starting over.
 * Overpass is a donated resource and re-scanning it for no reason is rude.
 *
 * OSM data is ODbL: storage and reuse are permitted with attribution, which
 * every generated row carries in its `source` column.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import tzLookup from "tz-lookup";
import {
  buildQuery,
  coordinatesOf,
  REQUEST_DELAY_MS,
  runQuery,
  slugify,
  sleep,
  sqlString,
  tile,
  US_REGIONS,
  type OverpassElement,
} from "../lib/import/overpass";
import { CATEGORY_SEARCHES, getCategorySearch, matchesKeywords } from "../lib/import/searches";
import { stateCode } from "../lib/us-states";

interface Candidate {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  timezone: string;
  openingHours: string | null;
  website: string | null;
  phone: string | null;
  osmType: string;
  osmId: number;
  matchedKeyword: string;
}

const CACHE_DIR = ".import-cache";

/** is_in is far lighter than a tile scan, so it does not need the same pause. */
const LOOKUP_DELAY_MS = 1_500;

async function main() {
  const [category, ...flags] = process.argv.slice(2);

  /*
    "all" runs every category in a single pass.

    Each category previously did its own sweep of the tile grid, which meant
    six passes downloading substantially the same museums, statues and
    attractions and differing only in which keywords they matched afterwards.
    One pass over the union of the tag sets, matched locally against every
    category, does the same work for a sixth of the requests.
  */
  const runAll = category === "all";
  const searches = runAll
    ? CATEGORY_SEARCHES
    : [getCategorySearch(category as never)].filter(Boolean);

  if (searches.length === 0) {
    console.error("Usage: npx tsx scripts/import-osm.mts <category|all> [--tile N]");
    console.error(`Categories: ${CATEGORY_SEARCHES.map((c) => c.category).join(", ")}, or "all"`);
    process.exit(1);
  }

  // The union, deduplicated: overlapping tag sets cost nothing extra.
  const tags = [...new Set(searches.flatMap((c) => c!.tags))];

  const tileSize = Number(valueOf(flags, "--tile") ?? 4);
  const tiles = US_REGIONS.flatMap((region) => tile(region, tileSize));

  mkdirSync(CACHE_DIR, { recursive: true });
  const checkpointPath = join(CACHE_DIR, `${category}-${tileSize}.json`);

  const state: {
    done: number;
    found: Candidate[];
    byCategory?: Record<string, Candidate[]>;
  } = existsSync(checkpointPath)
    ? JSON.parse(readFileSync(checkpointPath, "utf8"))
    : { done: 0, found: [], byCategory: {} };
  state.byCategory ??= {};

  if (state.done > 0) {
    console.log(`Resuming at tile ${state.done + 1} of ${tiles.length}.\n`);
  } else {
    console.log(`${tiles.length} tiles at ${tileSize}°. Roughly ${Math.round((tiles.length * REQUEST_DELAY_MS) / 60000)} minutes.\n`);
  }

  for (let index = state.done; index < tiles.length; index += 1) {
    const box = tiles[index];
    process.stdout.write(
      `[${index + 1}/${tiles.length}] ${box.south.toFixed(0)},${box.west.toFixed(0)} `,
    );

    let elements: OverpassElement[];
    try {
      elements = await runQuery(
        buildQuery(tags, box),
        (message) => console.log(`\n${message}`),
      );
    } catch (error) {
      // Save before dying, so the next run does not redo the work.
      writeFileSync(checkpointPath, JSON.stringify(state));
      console.error(`\nStopped at tile ${index + 1}: ${error}`);
      console.error(`Progress saved. Re-run the same command to continue.`);
      process.exit(1);
    }

    /*
      One element can only belong to one category, so the first search that
      claims it wins. Order in CATEGORY_SEARCHES is therefore meaningful:
      the more specific categories are listed before the broader ones.
    */
    let matched = 0;
    for (const element of elements) {
      for (const s of searches) {
        const candidate = toCandidate(element, s!.keywords);
        if (candidate) {
          (state.byCategory![s!.category] ??= []).push(candidate);
          state.found.push(candidate);
          matched += 1;
          break;
        }
      }
    }

    state.done = index + 1;
    writeFileSync(checkpointPath, JSON.stringify(state));

    console.log(`${elements.length} tagged, ${matched} matched`);

    if (index < tiles.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  const unique = dedupe(state.found);
  console.log(`\n${unique.length} unique places found.`);

  /*
    OSM rarely puts addr:city or addr:state on a statue or a small museum, so
    most rows arrive without a place name. Reverse geocoding fills them from
    coordinates. One request per gap, cached, and only for the handful that
    actually matched — cheap against the provider's daily allowance, and the
    difference between a handful of usable rows and all of them.
  */
  const needPlace = unique.filter((c) => !c.city || !c.state);

  if (needPlace.length > 0) {
    console.log(
      `\nLooking up city and state for ${needPlace.length} places via Overpass…`,
    );
    const cachePath = join(CACHE_DIR, `${category}-places.json`);
    const cache: Record<string, { city: string | null; state: string | null }> =
      existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};

    let failures = 0;

    for (const [index, candidate] of needPlace.entries()) {
      const key = `${candidate.latitude},${candidate.longitude}`;

      if (!(key in cache)) {
        process.stdout.write(
          `  [${index + 1}/${needPlace.length}] ${candidate.name.slice(0, 40)} `,
        );
        const startedAt = Date.now();
        const answer = await reversePlace(
          candidate.latitude,
          candidate.longitude,
        );
        console.log(
          answer.failed
            ? "— failed"
            : `— ${answer.city ?? "?"}, ${answer.state ?? "outside US"} (${Date.now() - startedAt}ms)`,
        );

        // Only remember real answers, so a failure is retried next run rather
        // than being frozen in as "this place has no city".
        if (!answer.failed) {
          cache[key] = { city: answer.city, state: answer.state };
          writeFileSync(cachePath, JSON.stringify(cache));
        } else {
          failures += 1;
        }

        // is_in is a cheap query, so a shorter pause is still polite.
        await sleep(LOOKUP_DELAY_MS);
      }

      candidate.city = candidate.city ?? cache[key]?.city ?? null;
      candidate.state = candidate.state ?? cache[key]?.state ?? null;

    }

    if (failures > 0) {
      console.log(
        `  ${failures} lookups failed and were not cached — re-run to retry them.`,
      );
    }
  }

  const stillMissing = unique.filter((c) => !c.city || !c.state).length;
  if (stillMissing > 0) {
    console.log(`${stillMissing} still have no city/state and are listed as comments.`);
  }

  // One file per category, so each can be reviewed and run on its own.
  if (runAll) {
    const uniqueSlugs = new Set(unique.map((c) => c.slug));
    for (const s of searches) {
      const rows = (state.byCategory![s!.category] ?? []).filter((c) =>
        uniqueSlugs.has(c.slug),
      );
      if (rows.length === 0) continue;
      const path = join("supabase", `import-${s!.category}.sql`);
      writeFileSync(path, toSql(dedupe(rows), s!.category));
      console.log(`  ${String(rows.length).padStart(4)}  ${path}`);
    }
    console.log("\nRead each file before you run it.");
  } else {
    const outputPath = join("supabase", `import-${category}.sql`);
    writeFileSync(outputPath, toSql(unique, category));
    console.log(`\nWrote ${outputPath}. Read it before you run it.`);
  }
}

function toCandidate(
  element: OverpassElement,
  keywords: string[],
): Candidate | null {
  const keyword = matchesKeywords(element.tags, keywords);
  if (!keyword) return null;

  const point = coordinatesOf(element);
  const name = element.tags?.name;
  if (!point || !name) return null;

  let timezone: string;
  try {
    timezone = tzLookup(point.latitude, point.longitude);
  } catch {
    return null; // Outside any known zone; almost certainly bad coordinates.
  }

  const tags = element.tags ?? {};

  return {
    name,
    slug: slugify(name),
    latitude: Number(point.latitude.toFixed(6)),
    longitude: Number(point.longitude.toFixed(6)),
    city: tags["addr:city"] ?? null,
    state: normaliseState(tags["addr:state"]),
    timezone,
    openingHours: tags.opening_hours ?? null,
    website: tags.website ?? tags["contact:website"] ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    osmType: element.type,
    osmId: element.id,
    matchedKeyword: keyword,
  };
}

/** The schema requires a two-letter code; OSM is inconsistent about this. */
function normaliseState(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 2 ? trimmed.toUpperCase() : null;
}

/** Tiles overlap at their edges, and slugs collide across states. */
function dedupe(candidates: Candidate[]): Candidate[] {
  const byOsmRef = new Map<string, Candidate>();
  for (const candidate of candidates) {
    byOsmRef.set(`${candidate.osmType}/${candidate.osmId}`, candidate);
  }

  const used = new Set<string>();
  return [...byOsmRef.values()].map((candidate) => {
    let slug = candidate.slug;
    let suffix = 2;
    while (used.has(slug)) {
      slug = `${candidate.slug}-${suffix}`;
      suffix += 1;
    }
    used.add(slug);
    return { ...candidate, slug };
  });
}

function toSql(candidates: Candidate[], category: string): string {
  const ready = candidates.filter((c) => c.city && c.state);
  const incomplete = candidates.filter((c) => !c.city || !c.state);

  const rows = ready
    .map(
      (c) =>
        `  (${sqlString(c.name)}, ${sqlString(c.slug)}, '${category}', ${c.latitude}, ${c.longitude}, ` +
        `${sqlString(c.city)}, ${sqlString(c.state)}, '', 'open', null, ` +
        `${sqlString(`https://www.openstreetmap.org/${c.osmType}/${c.osmId}`)}, ` +
        `${sqlString(c.openingHours)}, ${sqlString(c.website)}, ${sqlString(c.phone)}, ` +
        `${sqlString(c.osmType)}, ${c.osmId}, ${sqlString(c.timezone)})`,
    )
    .join(",\n");

  const skipped = incomplete
    .map(
      (c) =>
        `--   ${c.name} (${c.latitude}, ${c.longitude}) https://www.openstreetmap.org/${c.osmType}/${c.osmId}`,
    )
    .join("\n");

  return `-- OddWay import: ${category}
-- Generated ${new Date().toISOString()} from OpenStreetMap (ODbL).
--
-- READ THIS BEFORE RUNNING IT.
--
-- Descriptions are empty. OSM holds facts, not prose, and inventing
-- descriptions for real places would put unverified claims in front of
-- travellers. Every row lands with verified_at null and its OSM element as the
-- source, so the stop pages already say the entry is unverified.
--
-- ${ready.length} rows ready. ${incomplete.length} skipped for missing city or state.

${
  rows
    ? `insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description,
   public_access, image, source, opening_hours, website, phone,
   osm_type, osm_id, timezone)
values
${rows}
on conflict (slug) do update set
  latitude      = excluded.latitude,
  longitude     = excluded.longitude,
  opening_hours = excluded.opening_hours,
  website       = excluded.website,
  phone         = excluded.phone,
  osm_type      = excluded.osm_type,
  osm_id        = excluded.osm_id,
  timezone      = excluded.timezone,
  osm_synced_at = now();`
    : "-- Nothing to insert."
}

${skipped ? `-- Skipped, no city/state in OSM:\n${skipped}` : ""}
`;
}

/**
 * Coordinates to a city and two-letter state, via Overpass.
 *
 * OpenRouteService's reverse endpoint returns 403 on our key — it is not on
 * the plan — so this uses the same service the import already depends on.
 * `is_in` returns every administrative area containing a point, which gives
 * the state at admin_level 4 and the town at 8 in a single query, with no
 * quota to exhaust.
 */
async function reversePlace(
  latitude: number,
  longitude: number,
): Promise<{ city: string | null; state: string | null; failed: boolean }> {
  const query = `[out:json][timeout:30];is_in(${latitude},${longitude});out tags;`;

  let elements;
  try {
    elements = await runQuery(query, (message) => console.log(message));
  } catch (error) {
    console.log(`    lookup failed: ${String(error).slice(0, 90)}`);
    return { city: null, state: null, failed: true };
  }

  let state: string | null = null;
  let city: string | null = null;

  for (const element of elements) {
    const tags = element.tags ?? {};
    const level = tags.admin_level;
    const name = tags.name;
    if (!name) continue;

    if (level === "4" && !state) {
      // Prefer the ISO code when OSM carries one; fall back to the name.
      const iso = tags["ISO3166-2"];
      state = iso?.startsWith("US-") ? iso.slice(3) : stateCode(name);
    }
    // 8 is a city or town; 7 is sometimes a township. Take the smallest.
    if ((level === "8" || level === "7") && !city) city = name;
  }

  // Outside the US, or nothing administrative covers the point.
  if (!state) return { city: null, state: null, failed: false };

  return { city, state, failed: false };
}

function valueOf(flags: string[], name: string): string | undefined {
  const index = flags.indexOf(name);
  return index >= 0 ? flags[index + 1] : undefined;
}

void main();
