import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Dumps whatever the scan found, without geocoding.
 *
 * The tile sweep already records a name, a category and coordinates for every
 * candidate. Only city and state need Overpass, and when Overpass is
 * struggling that one step can take hours for data you may not need — so this
 * writes everything else out immediately and leaves the rest to you.
 *
 *   npx tsx scripts/dump-candidates.mts all 3
 */

const CACHE_DIR = ".import-cache";

interface Candidate {
  name: string;
  slug: string;
  category?: string;
  latitude: number;
  longitude: number;
  city?: string | null;
  state?: string | null;
  osmType?: string;
  osmId?: number;
  keyword?: string;
}

function main() {
  const [category = "all", tile = "3"] = process.argv.slice(2);
  const path = join(CACHE_DIR, `${category}-${tile}.json`);

  let state: { found?: Candidate[]; byCategory?: Record<string, Candidate[]> };
  try {
    state = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    console.error(`No checkpoint at ${path}. Available:`);
    for (const f of readdirSync(CACHE_DIR)) console.error(`  ${f}`);
    process.exit(1);
  }

  // Prefer the per-category breakdown; fall back to the flat list.
  const groups: Record<string, Candidate[]> =
    state.byCategory && Object.keys(state.byCategory).length > 0
      ? state.byCategory
      : { all: state.found ?? [] };

  const seen = new Set<string>();
  const rows: string[] = [
    "category,name,latitude,longitude,city,state,osm_url,matched_keyword",
  ];
  const counts: Record<string, number> = {};

  for (const [group, candidates] of Object.entries(groups)) {
    for (const c of candidates) {
      if (seen.has(c.slug)) continue;
      seen.add(c.slug);
      counts[group] = (counts[group] ?? 0) + 1;

      const osm =
        c.osmType && c.osmId
          ? `https://www.openstreetmap.org/${c.osmType}/${c.osmId}`
          : "";

      rows.push(
        [
          group,
          quote(c.name),
          c.latitude,
          c.longitude,
          quote(c.city ?? ""),
          quote(c.state ?? ""),
          osm,
          quote(c.keyword ?? ""),
        ].join(","),
      );
    }
  }

  const out = join("supabase", `candidates-${category}.csv`);
  writeFileSync(out, rows.join("\n") + "\n");

  console.log(`\n${seen.size} unique places written to ${out}\n`);
  for (const [group, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${group}`);
  }
  const located = [...groups ? Object.values(groups).flat() : []].filter(
    (c) => c.city && c.state,
  ).length;
  console.log(`\n  ${located} already have a city and state; the rest are blank.`);
}

/** Minimal CSV quoting: names contain commas and the odd apostrophe. */
function quote(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

main();
