/**
 * What a batch would actually do to the database.
 *
 * Run this before importing a complete state set. A full set mostly lands on
 * slugs that already exist and goes through the on-conflict clause, updating
 * descriptions and sources in place — so the count on /explore rises by the
 * handful that are genuinely new and says nothing about the two hundred rows
 * that were rewritten.
 *
 * That matters because the count is the only signal for a silent overwrite.
 * If it cannot be read, the check has to happen before the import instead.
 *
 *   npx tsx scripts/scope-diff.mts <batch.json> <STATE>
 *
 * where batch.json is the parsed output of parseBatch.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { slugVariants } from "./parse-batch.mts";

const [file, state] = process.argv.slice(2);
if (!file || !state) {
  console.error("  usage: npx tsx scripts/scope-diff.mts <batch.json> <STATE>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("  Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.");
  process.exit(1);
}

const supabase = createClient(url, anon);

/*
  Paged, because PostgREST silently truncates at 1,000 rows and the index is
  past six thousand. An unpaged read here would compare a batch against the
  first sixth of the database and call everything else new.
*/
const existing: Array<{ slug: string; name: string; state: string; source: string | null }> = [];
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await supabase
    .from("stops")
    .select("slug, name, state, source")
    .order("slug")
    .range(offset, offset + 999);
  if (error) throw new Error(error.message);
  existing.push(...data);
  if (data.length < 1000) break;
}
console.log(`  read ${existing.length} existing stops`);

const bySlug = new Map(existing.map((s) => [s.slug, s]));
const incoming = JSON.parse(readFileSync(file, "utf8")) as Array<{
  name: string; city: string; state: string; source: string | null;
}>;

const fresh: string[] = [];
const updates: string[] = [];
const crossState: string[] = [];

for (const stop of incoming) {
  // Both conventions, because the project has used two.
  const match = [...new Set(slugVariants(stop.name))]
    .map((v) => bySlug.get(v))
    .find(Boolean);

  if (!match) {
    fresh.push(stop.name);
  } else if (match.state !== state) {
    // The dangerous case: an upsert would rewrite a stop in another state.
    crossState.push(`${stop.name} -> ${match.slug} (${match.name}, ${match.state})`);
  } else {
    const from = (match.source ?? "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    const to = (stop.source ?? "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    updates.push(`${stop.name}  ${from || "none"} -> ${to || "none"}`);
  }
}

console.log(`\n  would insert:  ${fresh.length}`);
console.log(`  would update:  ${updates.length}`);
console.log(`  CROSS-STATE:   ${crossState.length}`);

if (crossState.length) {
  console.log("\n  These would overwrite a stop in another state. Rename them.");
  crossState.forEach((l) => console.log(`    ! ${l}`));
}

console.log("\n  new stops:");
fresh.forEach((n) => console.log(`    + ${n}`));

/*
  Only the source changes are printed for updates. The descriptions differ on
  almost every row and listing them buries the thing worth looking at: whether
  a good citation is about to be replaced with a worse one.
*/
const changed = updates.filter((l) => {
  const [, from, to] = l.match(/ {2}(\S+) -> (\S+)$/) ?? [];
  return from !== to;
});
console.log(`\n  updates that change the source domain: ${changed.length}`);
changed.forEach((l) => console.log(`    ~ ${l}`));
