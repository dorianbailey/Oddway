/**
 * A research batch, from .txt to reviewed SQL, in one command.
 *
 *   npx tsx scripts/import-state.mts <batch.txt> <STATE>
 *   npx tsx scripts/import-state.mts <batch.txt> <STATE> --existing rows.json
 *
 * Parses, normalises categories, assigns timezones, reads the whole index,
 * runs all three duplicate checks, and writes supabase/<state>-stops.sql.
 *
 * It refuses on a slug collision and prints the proximity and similar-name
 * findings for a person to rule on, because those are questions and a
 * collision is a verdict.
 *
 * This exists because the SQL step has been written by hand for every state.
 * csv-to-sql.mts is the OpenStreetMap scan importer and its on-conflict clause
 * is the opposite of what a research batch needs: it updates coordinates and
 * deliberately never touches the description. A batch that has been researched
 * wants the description and the source, and wants the checked coordinates left
 * alone.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import tzLookup from "tz-lookup";
import { createClient } from "@supabase/supabase-js";
import {
  parseBatch, checkBatch, similarlyNamed, slugVariants, slugify, metresBetween,
  type ParsedStop, type ExistingStop,
} from "./parse-batch.mts";
import { normaliseCategories } from "./import-categories.mts";

/**
 * The zone each state is legally in.
 *
 * tz-lookup is not used as the answer, only as a second opinion. It draws on
 * boundary shapes that are imprecise near state lines, and it is wrong about
 * both of the states this was written for: it puts Baker and Gold Butte in
 * Nevada on Phoenix and Denver, and Boise City in Oklahoma on Denver. All five
 * are legally Pacific and Central. A stop with the wrong clock shows the wrong
 * opening hours and nothing errors.
 *
 * States genuinely split between zones are listed below instead and are not
 * given a default, because a default is exactly the assumption that gets
 * Regent, Lefor, Winslow and the Petrified Forest wrong.
 */
const STATE_TIMEZONE: Record<string, string> = {
  AL: "America/Chicago", AR: "America/Chicago", CA: "America/Los_Angeles",
  CO: "America/Denver", CT: "America/New_York", DC: "America/New_York",
  DE: "America/New_York", GA: "America/New_York", HI: "Pacific/Honolulu",
  IA: "America/Chicago", IL: "America/Chicago", LA: "America/Chicago",
  MA: "America/New_York", MD: "America/New_York", ME: "America/New_York",
  MN: "America/Chicago", MO: "America/Chicago", MS: "America/Chicago",
  MT: "America/Denver", NC: "America/New_York", NH: "America/New_York",
  NJ: "America/New_York", NM: "America/Denver", NY: "America/New_York",
  OH: "America/New_York", OK: "America/Chicago", PA: "America/New_York",
  RI: "America/New_York", SC: "America/New_York", UT: "America/Denver",
  VA: "America/New_York", VT: "America/New_York", WA: "America/Los_Angeles",
  WI: "America/Chicago", WV: "America/New_York", WY: "America/Denver",

  /*
    Nevada is Pacific everywhere except West Wendover, which the federal DOT
    moved to Mountain in 1999 — the only part of the state legally outside
    Pacific. Jackpot, Owyhee, Mountain City and Jarbidge observe Mountain
    unofficially and are legally Pacific.

    Oklahoma is legally Central in its entirety, including all of Cimarron
    County. Kenton alone runs on Mountain unofficially, which is a local
    custom rather than a zone and is better said in a description than
    encoded in a timestamp.
  */
  NV: "America/Los_Angeles",
};

/** Towns that are legally outside their state's zone. */
const TOWN_TIMEZONE: Record<string, string> = {
  "NV:west wendover": "America/Denver",
};

/**
 * States with a real internal boundary. No default is offered, because the
 * boundary follows county and reservation lines rather than a meridian.
 */
const SPLIT_STATES: Record<string, string> = {
  AK: "Aleutians west of about 169W are America/Adak",
  AZ: "the Navajo Nation observes DST and the rest of the state does not; the Hopi Reservation sits inside it and keeps Phoenix time",
  FL: "panhandle west of the Apalachicola is Central",
  ID: "ten northern counties are Pacific, the rest Mountain, at about 45.5 N",
  IN: "most counties Eastern, some northwest and southwest Central",
  KS: "four western counties Mountain",
  KY: "split Eastern and Central",
  MI: "four western Upper Peninsula counties Central",
  ND: "Mountain towns listed by name, on county borders",
  NE: "panhandle Mountain, rest Central, at about -101",
  OR: "most Pacific, most of Malheur County Mountain",
  SD: "the Missouri River at about -100.5, which keeps Pierre Central",
  TN: "split Eastern and Central",
  TX: "El Paso and Hudspeth Mountain, rest Central, at about -104.9",
};

function timezoneFor(stop: ParsedStop): { zone: string; secondOpinion: string } {
  const secondOpinion = (() => {
    try { return tzLookup(stop.lat, stop.lon); } catch { return "unknown"; }
  })();
  const byTown = TOWN_TIMEZONE[`${stop.state}:${stop.city.toLowerCase()}`];
  if (byTown) return { zone: byTown, secondOpinion };
  const byState = STATE_TIMEZONE[stop.state];
  if (byState) return { zone: byState, secondOpinion };
  return { zone: secondOpinion, secondOpinion };
}

const sqlString = (value: string) => "'" + value.replace(/'/g, "''") + "'";

const [input, state, ...rest] = process.argv.slice(2);
if (!input || !state) {
  console.error("  usage: npx tsx scripts/import-state.mts <batch.txt> <STATE> [--existing rows.json]");
  process.exit(1);
}
if (!/^[A-Z]{2}$/.test(state)) {
  console.error(`  State must be a two-letter code, not "${state}". DC is DC, not Washington.`);
  process.exit(1);
}

const existingFile = rest.includes("--existing")
  ? rest[rest.indexOf("--existing") + 1]
  : null;

// ---------------------------------------------------------------- parse

const stops = parseBatch(input, state);
console.log(`\n  parsed ${stops.length} stops from ${input}`);

// ------------------------------------------------------------ categories

/*
  normaliseCategories mutates in place and throws on anything unmapped, which
  is the point. An unrecognised category must never quietly become a stop
  nobody can filter to.
*/
const changedCategories = normaliseCategories(stops);
const categorised = stops;

const catTally = new Map<string, number>();
for (const s of categorised) catTally.set(s.category, (catTally.get(s.category) ?? 0) + 1);
console.log(`  categories:  ${[...catTally].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join("  ")}`);
const renames = Object.entries(changedCategories).sort((a, b) => b[1] - a[1]);
console.log(`  ${renames.length} aliases applied` + (renames.length ? `, e.g. ${renames.slice(0, 3).map(([k, n]) => `${k} (${n})`).join(", ")}` : ""));

// ------------------------------------------------------------- timezones

if (SPLIT_STATES[state]) {
  console.error(
    `\n  ${state} is split between time zones: ${SPLIT_STATES[state]}.\n` +
    `  Add its towns to TOWN_TIMEZONE before importing. A longitude rule gets this wrong.`,
  );
  process.exit(1);
}

const zoned = categorised.map((s) => ({ ...s, ...timezoneFor(s) }));
const overridden = zoned.filter((s) => s.zone !== s.secondOpinion);
console.log(`  timezone:    ${STATE_TIMEZONE[state]} for all ${zoned.length}`);
if (overridden.length) {
  console.log(`  tz-lookup disagreed on ${overridden.length}, overruled by the state rule:`);
  for (const s of overridden) console.log(`      ${s.secondOpinion.padEnd(20)} ${s.name} (${s.city})`);
}

// -------------------------------------------------------------- the index

async function readIndex(): Promise<ExistingStop[]> {
  if (existingFile) return JSON.parse(readFileSync(existingFile, "utf8"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error("\n  Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first:");
    console.error("    export $(grep -E '^NEXT_PUBLIC_SUPABASE' .env.local | xargs)");
    process.exit(1);
  }
  const supabase = createClient(url, anon);
  const rows: ExistingStop[] = [];
  // Paged, because PostgREST truncates at 1,000 without saying so.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("stops").select("slug, name, city, state, latitude, longitude")
      .order("slug").range(offset, offset + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data as ExistingStop[]));
    if (data.length < 1000) break;
  }
  return rows;
}

const existing = await readIndex();
console.log(`\n  read ${existing.length} existing stops`);

// ---------------------------------------------------------- three checks

const report = checkBatch(zoned, existing);
const flags = similarlyNamed(zoned, existing);

console.log(`\n  similar names: ${flags.length}`);
for (const line of flags) console.log(`      ? ${line}`);

console.log(`\n  ${state} batch`);
console.log(`    duplicate slugs within: ${report.duplicateSlugsWithin.length}`);
console.log(`    near an existing stop:  ${report.nearbyExisting.length}`);
console.log(`    near each other:        ${report.internalDuplicates.length}`);
for (const line of report.nearbyExisting) console.log(`      ? ${line}`);
for (const line of report.internalDuplicates) console.log(`      ? ${line}`);

// ------------------------------------------------------------ what it does

const bySlug = new Map(existing.map((s) => [s.slug, s]));
const inserts: typeof zoned = [];
const updates: Array<{ stop: (typeof zoned)[number]; was: ExistingStop; metres: number }> = [];
const crossState: string[] = [];
const sameNameFarApart: string[] = [];

for (const stop of zoned) {
  const match = [...new Set(slugVariants(stop.name))].map((v) => bySlug.get(v)).find(Boolean);
  if (!match) { inserts.push(stop); continue; }

  if (match.state !== state) {
    crossState.push(`${stop.name} -> ${match.slug} ("${match.name}", ${match.state})`);
    continue;
  }

  /*
    A slug match inside the same state is an ordinary update when it is the
    same place. When it is hundreds of metres away it is a different place
    wearing the same name, and the upsert would overwrite the original. That
    is the Mystery Spot rule: the slug belongs to whoever arrived first and
    the newcomer carries its town.
  */
  const metres = metresBetween(stop.lat, stop.lon, match.latitude, match.longitude);
  if (metres > 400) {
    sameNameFarApart.push(
      `${stop.name} (${stop.city}) -> ${match.slug} ("${match.name}", ${match.city}) — ${Math.round(metres)}m apart`,
    );
    continue;
  }
  updates.push({ stop, was: match, metres });
}

/*
  Within-batch duplicate slugs are always wrong — the second silently replaces
  the first inside a single statement.
*/
if (report.duplicateSlugsWithin.length) {
  console.error(`\n  ${report.duplicateSlugsWithin.length} slugs appear twice in this batch:`);
  report.duplicateSlugsWithin.forEach((s) => console.error(`      ! ${s}`));
  process.exit(1);
}

if (crossState.length) {
  console.error(`\n  ${crossState.length} would overwrite a stop in ANOTHER STATE. Rename them:`);
  crossState.forEach((l) => console.error(`      ! ${l}`));
  console.error(`\n  The slug belongs to whoever arrived first. Add the town to the incoming name.`);
  process.exit(1);
}

if (sameNameFarApart.length) {
  console.error(`\n  ${sameNameFarApart.length} share a slug with a different place in ${state}:`);
  sameNameFarApart.forEach((l) => console.error(`      ! ${l}`));
  process.exit(1);
}

console.log(`\n  would insert: ${inserts.length}`);
console.log(`  would update: ${updates.length}`);
for (const { stop, was, metres } of updates) {
  const renamed = stop.name !== was.name ? `   name: "${was.name}" -> "${stop.name}"` : "";
  console.log(`      ~ ${stop.name}  (${Math.round(metres)}m from the stored pin)${renamed}`);
}

// -------------------------------------------------------------------- SQL

const values = zoned.map((s) => "  (" + [
  sqlString(s.name),
  sqlString(slugify(s.name)),
  sqlString(s.category),
  s.lat,
  s.lon,
  sqlString(s.city),
  sqlString(s.state),
  sqlString(s.description),
  sqlString(s.access),
  s.source ? sqlString(s.source) : "null",
  sqlString(s.zone),
].join(", ") + ")").join(",\n");

const sql = `-- ${state}: ${zoned.length} researched stops.
--
-- ${inserts.length} new, ${updates.length} updating a row already in the index.
-- After running this and scripts/refresh-site.mts, /explore should read
-- ${existing.length + inserts.length}.
--
-- Coordinates are deliberately NOT updated on conflict: a checked position
-- must never be replaced by an unchecked one. Where the existing row came
-- from the OpenStreetMap scan and is wrong by a kilometre, delete that slug
-- first and let this insert instead.
--
-- state is deliberately NOT updated either. That is how an overwritten stop
-- in another state keeps its old state and hides — so the collision check
-- above refuses rather than relying on anyone noticing afterwards.

insert into public.stops
  (name, slug, category, latitude, longitude, city, state, description,
   public_access, source, timezone)
values
${values}
on conflict (slug) do update set
  name          = excluded.name,
  category      = excluded.category,
  city          = excluded.city,
  description   = excluded.description,
  public_access = excluded.public_access,
  source        = excluded.source,
  timezone      = excluded.timezone;
`;

if (!existsSync("supabase")) mkdirSync("supabase");
const out = join("supabase", `${state.toLowerCase()}-stops.sql`);
writeFileSync(out, sql);

console.log(`\n  wrote ${out}`);
console.log(`\n  Next:`);
console.log(`    1. paste ${out} into the Supabase SQL editor and run it`);
console.log(`    2. export $(grep -E '^REVALIDATE_SECRET' .env.local | xargs)`);
console.log(`       npx tsx scripts/refresh-site.mts`);
console.log(`    3. /explore must read ${existing.length + inserts.length}. If it is short, a slug was overwritten:`);
console.log(`       select slug, name, state from stops`);
console.log(`       where verified_at > now() - interval '1 hour' and state <> '${state}';`);
console.log(`    4. npx tsx scripts/export-data.mts && git add -A && git commit\n`);
