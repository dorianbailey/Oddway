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
import { normaliseCategories, CATEGORY_ALIASES } from "./import-categories.mts";

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

  /*
    Kansas and Oregon each have a handful of towns on Mountain time, all of
    them listed in TOWN_TIMEZONE above. The rest of both states takes the
    default.
  */
  KS: "America/Chicago",
  OR: "America/Los_Angeles",
};

/**
 * Towns that are legally outside their state's zone.
 *
 * Listed by name rather than derived from a line on a map, because the
 * boundaries follow county lines: 49 CFR 71.7 puts four Kansas counties on
 * Mountain time and 71.9 does the same for most of Malheur County, Oregon.
 * A longitude rule would get Cheyenne County, Kansas wrong — it borders
 * Colorado on the west and Nebraska on the north and is still Central, so you
 * can enter Mountain time from three of its four sides.
 */
const TOWN_TIMEZONE: Record<string, string> = {
  "NV:west wendover": "America/Denver",

  /*
    Kansas: Sherman, Wallace, Greeley and Hamilton counties, all four on the
    Colorado line. Every other county in the state is Central.
  */
  "KS:goodland": "America/Denver",      // Sherman
  "KS:kanorado": "America/Denver",
  "KS:edson": "America/Denver",
  "KS:ruleton": "America/Denver",
  "KS:sharon springs": "America/Denver", // Wallace
  "KS:wallace": "America/Denver",
  "KS:weskan": "America/Denver",
  "KS:tribune": "America/Denver",        // Greeley
  "KS:horace": "America/Denver",
  "KS:syracuse": "America/Denver",       // Hamilton
  "KS:coolidge": "America/Denver",
  "KS:kendall": "America/Denver",

  /*
    Oregon: the northern four fifths of Malheur County, which runs on Boise
    time because that is where its shopping, schools and jobs are. The line
    sits at about 42.597 N; everything below it is empty desert, so every
    named community in the county is on the Mountain side.
  */
  "OR:ontario": "America/Boise",
  "OR:nyssa": "America/Boise",
  "OR:vale": "America/Boise",
  "OR:adrian": "America/Boise",
  "OR:jordan valley": "America/Boise",
  "OR:harper": "America/Boise",
  "OR:juntura": "America/Boise",
  "OR:brogan": "America/Boise",
  "OR:westfall": "America/Boise",
  "OR:ironside": "America/Boise",
  "OR:riverside": "America/Boise",
  "OR:jamieson": "America/Boise",
  "OR:willowcreek": "America/Boise",
  "OR:annex": "America/Boise",
  "OR:arock": "America/Boise",
  "OR:rome": "America/Boise",
  "OR:danner": "America/Boise",
  "OR:malheur city": "America/Boise",
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
  KY: "split Eastern and Central",
  MI: "four western Upper Peninsula counties Central",
  ND: "Mountain towns listed by name, on county borders",
  NE: "panhandle Mountain, rest Central, at about -101",
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

/**
 * The bucket a new category spelling most resembles.
 *
 * Scored on shared words against the 570-odd spellings already in the map, so
 * "historic-ranches" lands near "historic-houses" and "ufo-roadside" near
 * "ufo-lore". It is a suggestion to check, not a decision to trust.
 */
function suggestBucket(category: string): string {
  const words = (v: string) => v.split(/[^a-z0-9]+/).filter(Boolean);
  const mine = new Set(words(category));

  /*
    Every alias votes, weighted by how much of its name it shares with this
    one, and the bucket with the highest total wins.

    Two other scorings were tried and were worse. Picking the single closest
    alias sent "historic-ranches" to roadside-oddities on the strength of one
    "ranch" match, when thirty other historic-* spellings all say
    weird-history. Weighting rare words more heavily, so "ufo" counted for
    more than "roadside", fixed nothing and moved "archaeology-lore" out of
    folklore.

    On the three batches whose answers are known this gets about eleven of
    fifteen right. It is a starting point to read, not an answer to paste
    unchecked — the four it misses are the ones where a distinctive word like
    "ufo" or "cryptid" carries the meaning and the rest of the name does not.
  */
  const votes = new Map<string, number>();
  for (const [alias, bucket] of Object.entries(CATEGORY_ALIASES)) {
    const theirs = words(alias);
    if (!theirs.length) continue;
    const shared = theirs.filter((w) => mine.has(w));
    if (!shared.length) continue;
    const weight = shared.join("").length / new Set([...mine, ...theirs]).size;
    votes.set(bucket, (votes.get(bucket) ?? 0) + weight);
  }

  const ranked = [...votes].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "roadside-oddities";
}

const sqlString = (value: string) => "'" + value.replace(/'/g, "''") + "'";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error("\n  Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first:");
    console.error("    export $(grep -E '^NEXT_PUBLIC_SUPABASE' .env.local | xargs)");
    process.exit(1);
  }
  return createClient(url, anon);
}

/**
 * Checks the live index against what the generated SQL said it would produce.
 *
 *   npx tsx scripts/import-state.mts --verify OK && git push
 *
 * Exits non-zero when the number is wrong, so it can gate the push rather than
 * being one more thing to read and not read.
 *
 * Both directions are wrong and for different reasons. Short means a slug was
 * overwritten — the count is the only signal for that, because the on-conflict
 * clause leaves state alone and an overwritten stop keeps looking like a stop
 * in its old state. Over means something inserted that should have updated,
 * which is a duplicate: two Durant peanuts, 70 m apart, because a slug was
 * matched under one convention and written under another.
 */
if (process.argv[2] === "--verify") {
  const which = process.argv[3];
  if (!which) {
    console.error("  usage: npx tsx scripts/import-state.mts --verify <STATE>");
    process.exit(1);
  }

  const expectedFile = join("supabase", `${which.toLowerCase()}-expected.json`);
  if (!existsSync(expectedFile)) {
    console.error(`  No ${expectedFile}. Generate the SQL first.`);
    process.exit(1);
  }
  const expected = JSON.parse(readFileSync(expectedFile, "utf8")) as {
    state: string; total: number; inserts: number; updates: number;
  };

  const { count, error } = await client()
    .from("stops")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);

  const actual = count ?? 0;
  const drift = actual - expected.total;

  console.log(`\n  expected ${expected.total}   actual ${actual}`);
  if (drift === 0) {
    console.log(`  ${expected.state}: ${expected.inserts} inserted, ${expected.updates} updated. Safe to push.\n`);
    process.exit(0);
  }

  console.error(
    drift < 0
      ? `\n  SHORT BY ${-drift}. A slug was overwritten — a stop in another state now holds this state's content.`
      : `\n  OVER BY ${drift}. Something inserted that should have updated, so there are duplicates.`,
  );
  console.error(`  Do not push. Find them with:\n`);
  console.error(
    drift < 0
      ? `    select slug, name, state from stops\n` +
        `    where verified_at > now() - interval '1 hour' and state <> '${expected.state}';\n`
      : `    select slug, name, city, latitude, longitude from stops\n` +
        `    where state = '${expected.state}' order by name;\n`,
  );
  process.exit(1);
}

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
  is the point — an unrecognised category must never quietly become a stop
  nobody can filter to.

  But it throws on the first one, so a batch with seven new spellings takes
  seven runs to find them all, and each fix has to come from somewhere else.
  Every batch brings a few. So they are all collected here, with the bucket
  each one most resembles, printed as lines to paste straight into
  CATEGORY_ALIASES.

  The suggestion is a starting point, not an answer. Read it before pasting:
  the seven buckets are a real editorial decision and a wrong guess puts a
  stop under a filter nobody would look in.
*/
const distinct = [...new Set(stops.map((s) => s.category))];
const unmapped: string[] = [];
for (const category of distinct) {
  try {
    normaliseCategories([{ category, name: "probe" }]);
  } catch {
    unmapped.push(category);
  }
}

if (unmapped.length) {
  console.error(`\n  ${unmapped.length} categories have no mapping. Add these to`);
  console.error(`  CATEGORY_ALIASES in scripts/import-categories.mts, checking each one:\n`);
  for (const category of unmapped) {
    const example = stops.find((s) => s.category === category)!;
    console.error(`  ${JSON.stringify(category)}: ${JSON.stringify(suggestBucket(category))},`
      + `   // ${stops.filter((s) => s.category === category).length} stops, e.g. ${example.name}`);
  }
  console.error("");
  process.exit(1);
}

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
/*
  Report what was actually assigned, not the state default. The first version
  printed the default "for all N" regardless, so a town override fired and the
  summary still claimed every stop was on the state's clock — a check that
  cannot show its own work is not a check.
*/
const zoneTally = new Map<string, number>();
for (const s of zoned) zoneTally.set(s.zone, (zoneTally.get(s.zone) ?? 0) + 1);
console.log(
  `  timezone:    ${[...zoneTally].sort((a, b) => b[1] - a[1]).map(([z, n]) => `${z} ${n}`).join("   ")}`,
);
for (const s of zoned) {
  if (s.zone !== STATE_TIMEZONE[state]) {
    console.log(`      ${s.zone.padEnd(20)} ${s.name} (${s.city}) — listed town, not the state default`);
  }
}
if (overridden.length) {
  console.log(`  tz-lookup disagreed on ${overridden.length}, overruled by the state rule:`);
  for (const s of overridden) console.log(`      ${s.secondOpinion.padEnd(20)} ${s.name} (${s.city})`);
}

// -------------------------------------------------------------- the index

async function readIndex(): Promise<ExistingStop[]> {
  if (existingFile) return JSON.parse(readFileSync(existingFile, "utf8"));

  const supabase = client();
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

/*
  The slug written to SQL must be the slug that matched, not a fresh one.

  Matching uses both conventions the project has used; slugify() only produces
  the first. When an existing row was created under the other one — Durant's
  peanut was world-s-largest-peanut, not worlds-largest-peanut — the check
  correctly called it an update and the insert then wrote a slug that collided
  with nothing. Two Durant peanuts, 70 m apart, and a count one too high.

  An update writes the incumbent slug. Renaming a live page breaks every link
  to it, so the slug belongs to whoever arrived first even when the newer name
  is better.
*/
const slugFor = new Map<(typeof zoned)[number], string>();
for (const stop of inserts) slugFor.set(stop, slugify(stop.name));
for (const { stop, was } of updates) slugFor.set(stop, was.slug);

const values = zoned.map((s) => "  (" + [
  sqlString(s.name),
  sqlString(slugFor.get(s) ?? slugify(s.name)),
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

writeFileSync(
  join("supabase", `${state.toLowerCase()}-expected.json`),
  JSON.stringify(
    { state, total: existing.length + inserts.length, inserts: inserts.length, updates: updates.length },
    null, 2,
  ),
);

console.log(`\n  wrote ${out}`);
console.log(`\n  Next:`);
console.log(`    1. paste ${out} into the Supabase SQL editor and run it`);
console.log(`    2. export $(grep -E '^REVALIDATE_SECRET' .env.local | xargs)`);
console.log(`       npx tsx scripts/refresh-site.mts`);
console.log(`    3. /explore must read ${existing.length + inserts.length}. If it is short, a slug was overwritten:`);
console.log(`       select slug, name, state from stops`);
console.log(`       where verified_at > now() - interval '1 hour' and state <> '${state}';`);
console.log(`    4. npx tsx scripts/import-state.mts --verify ${state}`);
console.log(`    5. npx tsx scripts/export-data.mts && git add -A && git commit && git push`);
console.log(`\n  Step 4 exits non-zero on a wrong count, so it can gate the push:`);
console.log(`    npx tsx scripts/import-state.mts --verify ${state} && npx tsx scripts/export-data.mts && git add -A && git commit -m "Add ${inserts.length} ${state} stops" && git push\n`);
