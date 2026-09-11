/**
 * Parses a research batch to JSON, for scope-diff and the SQL generator to read.
 *
 * parseBatch is a library function with no command line of its own, which makes
 * "parse the batch" a step with nothing to type. This is that step.
 *
 *   npx tsx scripts/dump-batch.mts <batch.txt> <STATE> [out.json]
 *
 * Prints a summary rather than just a count, because a count is the number this
 * project has most often been wrong about. Read the summary.
 */
import { writeFileSync } from "node:fs";
import { parseBatch } from "./parse-batch.mts";

const [input, state, output] = process.argv.slice(2);

if (!input || !state) {
  console.error("  usage: npx tsx scripts/dump-batch.mts <batch.txt> <STATE> [out.json]");
  console.error("  e.g.   npx tsx scripts/dump-batch.mts ~/Downloads/nevada.txt NV");
  process.exit(1);
}

if (!/^[A-Z]{2}$/.test(state)) {
  // "Washington" parses as WA, and DC is written DC. Catch it here rather than
  // after 153 stops have gone into the wrong state.
  console.error(`  State must be a two-letter code, not "${state}". DC is DC, not Washington.`);
  process.exit(1);
}

const out = output ?? `${state.toLowerCase()}-batch.json`;

// parseBatch throws on anything it cannot read, naming each stop. Let it.
const stops = parseBatch(input, state);

writeFileSync(out, JSON.stringify(stops, null, 2));

const tally = (key: "category" | "access") => {
  const counts = new Map<string, number>();
  for (const s of stops) counts.set(s[key], (counts.get(s[key]) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join("  ");
};

const lats = stops.map((s) => s.lat);
const lons = stops.map((s) => s.lon);

console.log(`\n  parsed ${stops.length} stops -> ${out}`);
console.log(`  states:      ${[...new Set(stops.map((s) => s.state))].join(", ")}`);
console.log(`  latitude:    ${Math.min(...lats).toFixed(5)} to ${Math.max(...lats).toFixed(5)}`);
console.log(`  longitude:   ${Math.min(...lons).toFixed(5)} to ${Math.max(...lons).toFixed(5)}`);
console.log(`  access:      ${tally("access")}`);
console.log(`  categories:  ${new Set(stops.map((s) => s.category)).size} distinct`);
console.log(`  no source:   ${stops.filter((s) => !s.source).length}`);
console.log(`  no descr:    ${stops.filter((s) => !s.description).length}`);

/*
  A bare root domain passes every aggregator test and says nothing about the
  specific place. Seven Nevada ghost towns cited one landing page between them,
  and the only way that was ever going to surface was by counting it.
*/
const rootOnly = stops.filter((s) => {
  if (!s.source) return false;
  try {
    const { pathname, search } = new URL(s.source);
    return (pathname === "/" || pathname === "") && !search;
  } catch {
    return false;
  }
});
const shared = new Map<string, string[]>();
for (const s of stops) {
  if (!s.source) continue;
  shared.set(s.source, [...(shared.get(s.source) ?? []), s.name]);
}
const reused = [...shared].filter(([, names]) => names.length >= 3);

console.log(`  root-domain sources: ${rootOnly.length}`);
console.log(`  one URL shared by 3+ stops: ${reused.length}`);
for (const [url, names] of reused.sort((a, b) => b[1].length - a[1].length)) {
  console.log(`    x${names.length}  ${url}`);
  for (const n of names) console.log(`         ${n}`);
}

console.log(`\n  next: npx tsx scripts/scope-diff.mts ${out} ${state}\n`);
