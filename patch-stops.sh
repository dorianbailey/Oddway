#!/bin/bash
# Two edits to lib/stops.ts:
#   1. getStopSlugs also selects `source`, so the about page can count how many
#      entries rest on a competing guide without a second full read.
#   2. countAggregatorSourced, alongside countUnverified.
set -e
cd "$(dirname "$0")"
[ -f lib/stops.ts ] || { echo "Run this from the repo root (lib/stops.ts not found)."; exit 1; }
cp lib/stops.ts lib/stops.ts.bak
python3 - <<'PY'
import re, sys
p = "lib/stops.ts"
s = open(p, encoding="utf-8").read()

old_sig = 'async (): Promise<Array<{ slug: string; verifiedAt: string | null }>> => {'
new_sig = 'async (): Promise<Array<{ slug: string; verifiedAt: string | null; source: string | null }>> => {'

old_demo = 'return DEMO_STOPS.map((s) => ({ slug: s.slug, verifiedAt: s.verifiedAt }));'
new_demo = 'return DEMO_STOPS.map((s) => ({ slug: s.slug, verifiedAt: s.verifiedAt, source: s.source }));'

old_rows = 'const rows: Array<{ slug: string; verified_at: string | null }> = [];'
new_rows = 'const rows: Array<{ slug: string; verified_at: string | null; source: string | null }> = [];'

old_sel = '.select("slug, verified_at")'
new_sel = '.select("slug, verified_at, source")'

old_map = 'return rows.map((r) => ({ slug: r.slug, verifiedAt: r.verified_at }));'
new_map = 'return rows.map((r) => ({ slug: r.slug, verifiedAt: r.verified_at, source: r.source }));'

old_count = '''/** How many entries admit they are unverified. Used on the about page. */
export async function countUnverified(): Promise<number> {
  return (await getStopSlugs()).filter((s) => !s.verifiedAt).length;
}'''

new_count = '''/** How many entries admit they are unverified. Used on the about page. */
export async function countUnverified(): Promise<number> {
  return (await getStopSlugs()).filter((s) => !s.verifiedAt).length;
}

/** Travel guides covering the same ground as OddWay. Mirrors lib/sources.ts. */
const COMPETING_GUIDES = [
  "atlasobscura.com",
  "roadsideamerica.com",
  "onlyinyourstate.com",
  "thrillist.com",
  "tripadvisor.com",
  "yelp.com",
  "mapcarta.com",
];

/**
 * How many entries rest entirely on a rival travel guide.
 *
 * Less a failure than an admission: for these, nobody else has written the
 * place up. lib/sources.ts already renders them as an unlinked credit, so a
 * reader can see where a claim came from without us handing over the click —
 * but a guide's write-up is weaker than the place's own site or the agency
 * that manages it, and saying how many there are is more honest than not.
 *
 * Counted rather than written down, for the same reason as everything else on
 * that page. The unverified figure sat at 25 for months, became 1,120 in a
 * single evening when an import forgot a column, and nothing noticed because
 * nothing errored.
 */
export async function countAggregatorSourced(): Promise<number> {
  return (await getStopSlugs()).filter((s) =>
    COMPETING_GUIDES.some((guide) => (s.source ?? "").includes(guide)),
  ).length;
}'''

for old, new, label in [
    (old_sig, new_sig, "return type"),
    (old_demo, new_demo, "demo fallback"),
    (old_rows, new_rows, "row type"),
    (old_sel, new_sel, "select"),
    (old_map, new_map, "mapping"),
    (old_count, new_count, "countAggregatorSourced"),
]:
    n = s.count(old)
    if n != 1:
        print(f"  ABORT: expected exactly one '{label}', found {n}. Nothing written.")
        sys.exit(1)
    s = s.replace(old, new)

open(p, "w", encoding="utf-8").write(s)
print("  lib/stops.ts patched")
PY
echo "  backup at lib/stops.ts.bak"
