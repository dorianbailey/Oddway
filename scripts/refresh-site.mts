/**
 * Tells the live site that the index changed.
 *
 * Run this after importing stops through the SQL editor. Without it the site
 * keeps serving whatever it cached at the last deployment: pages read the
 * whole index through a tagged cache, and nothing was clearing that tag.
 *
 * The symptom is quiet. Individual stop pages work because they query by
 * slug, so nothing 404s and nothing errors — the site just reports fewer
 * places than it holds, and there is no reason to go looking.
 *
 *   export REVALIDATE_SECRET=...        # same value as in Vercel
 *   npx tsx scripts/refresh-site.mts
 */

const SITE = process.env.SITE_URL ?? "https://taketheoddway.com";
const secret = process.env.REVALIDATE_SECRET;

if (!secret) {
  console.error("  Set REVALIDATE_SECRET first, to the same value as in Vercel.");
  process.exit(1);
}

const response = await fetch(`${SITE}/api/revalidate`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});

const body = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(`  Failed: HTTP ${response.status}`, body);
  process.exit(1);
}

console.log("  Caches cleared:", (body.revalidated ?? []).join(", "));

/*
  Then check it worked, because the whole point of this script is that the
  failure it fixes is invisible. Reporting success without looking would be
  the same mistake in a new place.
*/
const html = await fetch(`${SITE}/explore`, { cache: "no-store" }).then((r) => r.text());
const shown = html.match(/([\d,]{3,7})\s*places/i)?.[1];
console.log(`  /explore now reports: ${shown ?? "could not read the count"}`);
