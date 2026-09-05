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
import { getCategorySearch, matchesKeywords } from "../lib/import/searches";

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

async function main() {
  const [category, ...flags] = process.argv.slice(2);
  const search = category ? getCategorySearch(category as never) : undefined;

  if (!search) {
    console.error("Usage: npx tsx scripts/import-osm.mts <category> [--tile N]");
    console.error("Categories: cryptids, haunted, ufos, roadside-oddities");
    process.exit(1);
  }

  const tileSize = Number(valueOf(flags, "--tile") ?? 4);
  const tiles = US_REGIONS.flatMap((region) => tile(region, tileSize));

  mkdirSync(CACHE_DIR, { recursive: true });
  const checkpointPath = join(CACHE_DIR, `${category}-${tileSize}.json`);

  const state: { done: number; found: Candidate[] } = existsSync(checkpointPath)
    ? JSON.parse(readFileSync(checkpointPath, "utf8"))
    : { done: 0, found: [] };

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
        buildQuery(search.tags, box),
        (message) => console.log(`\n${message}`),
      );
    } catch (error) {
      // Save before dying, so the next run does not redo the work.
      writeFileSync(checkpointPath, JSON.stringify(state));
      console.error(`\nStopped at tile ${index + 1}: ${error}`);
      console.error(`Progress saved. Re-run the same command to continue.`);
      process.exit(1);
    }

    const matches = elements
      .map((element) => toCandidate(element, search.keywords))
      .filter((candidate): candidate is Candidate => candidate !== null);

    state.found.push(...matches);
    state.done = index + 1;
    writeFileSync(checkpointPath, JSON.stringify(state));

    console.log(`${elements.length} tagged, ${matches.length} matched`);

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
    const apiKey = readApiKey();

    if (!apiKey) {
      console.log(
        `\n${needPlace.length} have no city/state and ORS_API_KEY was not found in .env.local.`,
      );
      console.log("They will be listed as comments rather than dropped.");
    } else {
      console.log(`\nLooking up city and state for ${needPlace.length} places…`);
      const cachePath = join(CACHE_DIR, `${category}-places.json`);
      const cache: Record<string, { city: string | null; state: string | null }> =
        existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};

      for (const [index, candidate] of needPlace.entries()) {
        const key = `${candidate.latitude},${candidate.longitude}`;

        if (!(key in cache)) {
          cache[key] = await reversePlace(
            candidate.latitude,
            candidate.longitude,
            apiKey,
          );
          writeFileSync(cachePath, JSON.stringify(cache));
          await sleep(600);
        }

        candidate.city = candidate.city ?? cache[key].city;
        candidate.state = candidate.state ?? cache[key].state;

        if ((index + 1) % 10 === 0) {
          console.log(`  ${index + 1}/${needPlace.length}`);
        }
      }
    }
  }

  const stillMissing = unique.filter((c) => !c.city || !c.state).length;
  if (stillMissing > 0) {
    console.log(`${stillMissing} still have no city/state and are listed as comments.`);
  }

  const outputPath = join("supabase", `import-${category}.sql`);
  writeFileSync(outputPath, toSql(unique, category));
  console.log(`\nWrote ${outputPath}. Read it before you run it.`);
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
 * Key for the import, read from .env.local; this script runs outside Next.
 *
 * Prefers ORS_IMPORT_KEY over ORS_API_KEY. Bulk imports and live traffic have
 * opposite shapes — hundreds of requests in ten minutes versus a handful per
 * visitor — and sharing one key means an import can exhaust the quota the
 * website depends on. That is exactly what happened during the haunted run.
 */
function readApiKey(): string | null {
  for (const name of ["ORS_IMPORT_KEY", "ORS_API_KEY"]) {
    const value = readEnv(name);
    if (value) {
      if (name === "ORS_API_KEY") {
        console.log(
          "Using ORS_API_KEY. Set ORS_IMPORT_KEY to a second token so a long\n" +
            "import cannot use up the quota the live site needs.\n",
        );
      }
      return value;
    }
  }
  return null;
}

function readEnv(name: string): string | null {
  try {
    const line = readFileSync(".env.local", "utf8")
      .split("\n")
      .find((row) => row.startsWith(`${name}=`));
    const value = line?.slice(name.length + 1).trim();
    return value ? value : null;
  } catch {
    return null;
  }
}

/**
 * Coordinates to a city and two-letter state.
 *
 * Failures return nulls rather than throwing: a missing place name should
 * leave one row commented out, not abandon the whole run.
 */
async function reversePlace(
  latitude: number,
  longitude: number,
  apiKey: string,
): Promise<{ city: string | null; state: string | null }> {
  const url = new URL("https://api.openrouteservice.org/geocode/reverse");
  url.searchParams.set("point.lat", String(latitude));
  url.searchParams.set("point.lon", String(longitude));
  url.searchParams.set("size", "1");
  // Deliberately NOT filtering by country. Forcing a US match would relabel a
  // point in British Columbia as the nearest American town, silently putting
  // Canadian places in a US index. Better to read the country back and reject.

  try {
    const response = await fetch(url, {
      headers: { Authorization: apiKey, Accept: "application/json" },
    });
    if (!response.ok) return { city: null, state: null };

    const data = (await response.json()) as {
      features?: Array<{
        properties?: {
          locality?: string;
          localadmin?: string;
          county?: string;
          region_a?: string;
          country_a?: string;
        };
      }>;
    };

    const props = data.features?.[0]?.properties;

    // Outside the US: leave it unplaced so it is commented out, not imported.
    if (props?.country_a && props.country_a !== "USA") {
      return { city: null, state: null };
    }

    const region = props?.region_a;

    return {
      city: props?.locality ?? props?.localadmin ?? props?.county ?? null,
      state: region && region.length === 2 ? region.toUpperCase() : null,
    };
  } catch {
    return { city: null, state: null };
  }
}

function valueOf(flags: string[], name: string): string | undefined {
  const index = flags.indexOf(name);
  return index >= 0 ? flags[index + 1] : undefined;
}

void main();
