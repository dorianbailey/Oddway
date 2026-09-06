import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import tzLookup from "tz-lookup";

/**
 * Turns a reviewed candidates CSV into one SQL file per category.
 *
 * The CSV is the review step: delete a row and it does not get imported. That
 * is deliberately easier than pruning live data, which was the lesson of the
 * haunted run.
 *
 * Rows without a city and state are skipped rather than guessed — that is
 * every entry the border check flagged as outside the US.
 *
 *   npx tsx scripts/csv-to-sql.mts supabase/candidates-all.csv
 */

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

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const CATEGORY_NOUN: Record<string, string> = {
  "roadside-oddities": "roadside oddity",
  cryptids: "cryptid site",
  haunted: "reportedly haunted place",
  folklore: "piece of local folklore",
  ufos: "UFO site",
  "weird-history": "piece of weird history",
  museums: "small museum",
};

/** Says what we know and admits what we do not. */
function placeholder(category: string, city: string, state: string): string {
  const noun = CATEGORY_NOUN[category] ?? "unusual stop";
  return (
    `A ${noun} in ${city}, ${state}, found in OpenStreetMap. ` +
    `Nobody has written this one up yet, so check the source link and the ` +
    `access details before making a special trip.`
  );
}

function sqlString(value: string): string {
  return "'" + value.replace(/'/g, "''") + "'";
}

const path = process.argv[2] ?? "supabase/candidates-all.csv";
const rows = parseCsv(readFileSync(path, "utf8"));
const header = rows[0];
const col = (name: string) => header.indexOf(name);

const byCategory = new Map<string, string[]>();
const usedSlugs = new Set<string>();
let skipped = 0;

for (const row of rows.slice(1)) {
  const category = row[col("category")];
  const name = row[col("name")].trim();
  const city = row[col("city")].trim();
  const state = row[col("state")].trim().toUpperCase();
  const lat = Number(row[col("latitude")]);
  const lon = Number(row[col("longitude")]);
  const osm = row[col("osm_url")];

  // No location means it cannot be routed to or filtered by state.
  if (!name || !city || state.length !== 2 || !Number.isFinite(lat)) {
    skipped += 1;
    continue;
  }

  let slug = slugify(name);
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${slugify(name)}-${n++}`;
  usedSlugs.add(slug);

  let timezone: string;
  try {
    timezone = tzLookup(lat, lon);
  } catch {
    skipped += 1;
    continue;
  }

  const values = [
    sqlString(name),
    sqlString(slug),
    sqlString(category),
    lat,
    lon,
    sqlString(city),
    sqlString(state),
    /*
      description is NOT NULL, and an empty string would render as a blank
      card with no explanation. A placeholder that says plainly it has not
      been written yet is more useful and more honest — and it names the town
      and links the source so the page is not entirely useless in the
      meantime.

      Written as a placeholder rather than a description so it is obvious
      which entries still need work.
    */
    sqlString(placeholder(category, city, state)),
    "'open'",
    osm ? sqlString(osm) : "null",
    sqlString(timezone),
  ].join(", ");

  const list = byCategory.get(category) ?? [];
  list.push(`  (${values})`);
  byCategory.set(category, list);
}

for (const [category, values] of byCategory) {
  const sql = `-- ${category}: ${values.length} places from the OpenStreetMap scan.
--
-- Reviewed as a CSV before generation, so anything unwanted was deleted there
-- rather than pruned out of live data afterwards.
--
-- Descriptions are null and verified_at is unset: these pages will say the
-- entry is unverified until somebody writes one, which is honest and is the
-- same discipline the rest of the index follows.

insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description,
   public_access, source, timezone)
values
${values.join(",\n")}
on conflict (slug) do update set
  latitude  = excluded.latitude,
  longitude = excluded.longitude,
  city      = excluded.city,
  state     = excluded.state,
  timezone  = excluded.timezone;
-- Note: description is deliberately not updated here. Re-running this must
-- never overwrite a description somebody has written with the placeholder.
`;

  const out = join("supabase", `import-${category}.sql`);
  writeFileSync(out, sql);
  console.log(`  ${String(values.length).padStart(4)}  ${out}`);
}

console.log(`\n  ${skipped} rows skipped for having no usable city, state or timezone.`);
