import { readFileSync, writeFileSync } from "node:fs";
import cities from "all-the-cities";

/**
 * Fills in city and state from coordinates, offline.
 *
 * The importer normally asks Overpass which administrative areas contain each
 * point, which is accurate but needs a public service that is frequently
 * overloaded — 300 lookups can take hours, or fail outright.
 *
 * This instead finds the nearest populated place in a gazetteer of 16,677 US
 * cities shipped as a package. It is an approximation: it answers "what town
 * is this near", not "what town is this in". For a road trip index that is the
 * more useful answer anyway, but it is not the same answer, so anything
 * suspiciously far from its nearest town is flagged rather than accepted.
 *
 *   npx tsx scripts/fill-locations.mts supabase/candidates-all.csv
 */

/*
  Every country, not just the US.

  Filtering to US cities first looks sensible and is quietly wrong: a point in
  Ottawa then matches the nearest American town across the border and is
  labelled "Ogdensburg, NY" with complete confidence. Searching all countries
  and checking what comes back is the only way to tell a remote American place
  from a Canadian one.
*/
const ALL = cities;

const EARTH_RADIUS_KM = 6371;

function distanceKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function nearest(lat: number, lon: number) {
  let best: (typeof ALL)[number] | null = null;
  let bestKm = Infinity;

  for (const city of ALL) {
    const [cLon, cLat] = city.loc.coordinates;
    // Cheap rejection before the expensive trigonometry: one degree of
    // latitude is about 111km, so anything beyond a degree or so cannot win.
    if (Math.abs(cLat - lat) > 1.2 || Math.abs(cLon - lon) > 1.6) continue;

    const km = distanceKm(lat, lon, cLat, cLon);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  return best
    ? {
        city: best.name,
        state: best.adminCode,
        country: best.country,
        km: bestKm,
      }
    : null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ""));
}

function quote(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const path = process.argv[2] ?? "supabase/candidates-all.csv";
const rows = parseCsv(readFileSync(path, "utf8"));
const header = rows[0];

const iLat = header.indexOf("latitude");
const iLon = header.indexOf("longitude");
const iCity = header.indexOf("city");
const iState = header.indexOf("state");

let filled = 0;
let kept = 0;
let far = 0;
let outside = 0;
const out = [[...header, "km_to_town", "review"].join(",")];

for (const row of rows.slice(1)) {
  const lat = Number(row[iLat]);
  const lon = Number(row[iLon]);
  let km = "";
  let note = "";

  if (row[iCity] && row[iState]) {
    kept += 1; // Already located by Overpass; that answer is better.
  } else {
    const match = nearest(lat, lon);
    if (!match) {
      // Nothing within range at all: almost certainly ocean.
      note = "no town within range";
    } else if (match.country !== "US") {
      /*
        Left blank rather than guessed. The index covers the United States, and
        an entry labelled with an American town it is not in is worse than an
        entry with no town at all.
      */
      note = `outside the US (nearest: ${match.city}, ${match.country})`;
      outside += 1;
    } else {
      row[iCity] = match.city;
      row[iState] = match.state;
      km = match.km.toFixed(1);
      filled += 1;
      // Beyond about 40km "nearest town" stops being a useful label.
      if (match.km > 40) { far += 1; note = "far from any town"; }
    }
  }
  out.push([...row.map(quote), km, quote(note)].join(","));
}

writeFileSync(path, out.join("\n") + "\n");
console.log(`\n  ${kept} already located by the importer, left alone`);
console.log(`  ${filled} filled from the gazetteer`);
console.log(`  ${far} of those are more than 40km from any town — check these`);
console.log(`  ${outside} are outside the US and were left blank, not guessed`);
console.log(`\n  written back to ${path}`);
