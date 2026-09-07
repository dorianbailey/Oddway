import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Exports the live database back into SQL.
 *
 * Most of a day's research reached the database through the SQL editor and
 * never touched a file, which meant `supabase/` no longer described what the
 * site actually contained: it would have rebuilt every stop with a placeholder
 * description and no source.
 *
 * Generated from the database rather than assembled from the import scripts on
 * purpose. The imports record how the data was gathered; only the database
 * records what it became after the corrections — names rewritten, cities moved
 * across state lines, access changed from assumption to checked fact.
 *
 * Re-run this after any editing session:
 *   npx tsx scripts/export-data.mts
 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const STOP_COLUMNS = [
  "name", "slug", "category", "latitude", "longitude", "city", "state",
  "description", "public_access", "image", "source", "verified_at",
  "opening_hours", "website", "phone", "osm_type", "osm_id", "timezone",
];

const EVENT_COLUMNS = [
  "name", "slug", "city", "state", "latitude", "longitude", "timezone",
  "category", "start_date", "days", "display_date", "date_confidence",
  "description", "website", "contact", "notes",
];

const NUMERIC = new Set([
  "latitude", "longitude", "osm_id", "days",
]);
/** Enum columns: quoted, but never null in practice. */
const RAW_ENUM = new Set(["category", "public_access", "date_confidence"]);

function literal(column: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "null";
  if (NUMERIC.has(column)) return String(value);
  if (RAW_ENUM.has(column)) return `'${value}'`;
  return "'" + String(value).split("'").join("''") + "'";
}

async function fetchAll(table: string, columns: string[], order: string) {
  const response = await fetch(
    `${URL_BASE}/rest/v1/${table}?select=${columns.join(",")}&order=${order}&limit=2000`,
    { headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` } },
  );
  if (!response.ok) {
    throw new Error(`${table}: HTTP ${response.status}`);
  }
  return (await response.json()) as Array<Record<string, unknown>>;
}

function toSql(
  table: string,
  columns: string[],
  rows: Array<Record<string, unknown>>,
  header: string,
): string {
  const values = rows
    .map((row) => "  (" + columns.map((c) => literal(c, row[c])).join(", ") + ")")
    .join(",\n");

  // Everything except the conflict key is refreshed, so re-running the file
  // brings a database back into line rather than erroring or duplicating.
  const updates = columns
    .filter((c) => c !== "slug")
    .map((c) => `  ${c.padEnd(13)} = excluded.${c}`)
    .join(",\n");

  return `${header}
--
-- ${rows.length} rows. Safe to re-run: conflicts update in place.

insert into public.${table}
  (${columns.join(", ")})
values
${values}
on conflict (slug) do update set
${updates};
`;
}

async function main() {
  if (!URL_BASE || !KEY) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first:");
    console.error("  export $(grep -E '^NEXT_PUBLIC_SUPABASE' .env.local | xargs)");
    process.exit(1);
  }

  const stops = await fetchAll("stops", STOP_COLUMNS, "category,slug");
  const stopsPath = join("supabase", "data-stops.sql");
  writeFileSync(
    stopsPath,
    toSql("stops", STOP_COLUMNS, stops,
      `-- Every stop in the index, exported from the live database.
--
-- This supersedes the individual import and description files. Those record
-- how the data was gathered; this records what it became.`),
  );
  console.log(`  ${String(stops.length).padStart(4)}  ${stopsPath}`);

  const events = await fetchAll("events", EVENT_COLUMNS, "start_date");
  const eventsPath = join("supabase", "data-events.sql");
  writeFileSync(
    eventsPath,
    toSql("events", EVENT_COLUMNS, events,
      "-- Every event, exported from the live database."),
  );
  console.log(`  ${String(events.length).padStart(4)}  ${eventsPath}`);

  console.log("\n  Re-run after any session of editing data in the SQL editor.");
}

main();
