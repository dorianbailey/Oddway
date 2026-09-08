import cities from "all-the-cities";

/**
 * Finds stops whose coordinates look like a town centre rather than a place.
 *
 * When a location cannot be pinned down, the easy fallback is the middle of
 * the nearest town — and the result is indistinguishable from a real
 * coordinate. The map shows a pin, the pin looks confident, and it is wrong.
 *
 * A stop sitting within a couple of hundred metres of a gazetteer town centre
 * is suspicious. Some are legitimate: a courthouse, a downtown sculpture, a
 * main-street museum genuinely is in the middle of town. So this reports
 * rather than decides.
 *
 *   npx tsx scripts/audit-centroids.mts
 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const US = cities.filter((c) => c.country === "US");

function metres(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

async function main() {
  if (!URL_BASE || !KEY) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    process.exit(1);
  }

  const stops = await fetch(
    `${URL_BASE}/rest/v1/stops?select=slug,name,city,state,latitude,longitude,public_access&limit=1000`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  ).then((r) => r.json());

  const suspect: Array<{ m: number; line: string }> = [];

  for (const stop of stops) {
    // Only compare against a town of the same name in the same state.
    const town = US.find(
      (c) =>
        c.adminCode === stop.state &&
        c.name.toLowerCase() === String(stop.city).toLowerCase(),
    );
    if (!town) continue;

    const [lon, lat] = town.loc.coordinates;
    const d = metres(stop.latitude, stop.longitude, lat, lon);
    if (d > 250) continue;

    suspect.push({
      m: d,
      line: `  ${String(Math.round(d)).padStart(4)}m  ${stop.state}  ${stop.name.slice(0, 42).padEnd(44)} ${stop.city}`,
    });
  }

  suspect.sort((a, b) => a.m - b.m);
  console.log(`\n  ${stops.length} stops checked`);
  console.log(`  ${suspect.length} sit within 250m of their town centre\n`);
  console.log("  Some of these are correct — a downtown sculpture really is");
  console.log("  downtown. The rest are a coordinate nobody actually found.\n");
  console.log(suspect.map((s) => s.line).join("\n"));
}

main();
