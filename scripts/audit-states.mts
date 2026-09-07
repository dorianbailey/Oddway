import cities from "all-the-cities";

/**
 * Finds stops whose state label may be wrong.
 *
 * The offline gazetteer picks the nearest populated place by distance and has
 * no idea state boundaries exist, so a point five miles inside Wyoming can be
 * labelled with a Utah town. That happened four times in one batch of thirty
 * — it only surfaced because ghost towns sit in remote country near borders.
 *
 * This does not decide the answer: proving which side of a line a point falls
 * on needs real boundary geometry. It finds the rows where the question is
 * live, which is the cheap half of the job.
 *
 *   npx tsx scripts/audit-states.mts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const US = cities.filter((c) => c.country === "US");

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** The closest city in each state, so a border can be seen. */
function nearestPerState(lat: number, lon: number) {
  const best = new Map<string, number>();
  for (const city of US) {
    const [cLon, cLat] = city.loc.coordinates;
    if (Math.abs(cLat - lat) > 2 || Math.abs(cLon - lon) > 2.5) continue;
    const km = distanceKm(lat, lon, cLat, cLon);
    const seen = best.get(city.adminCode);
    if (seen === undefined || km < seen) best.set(city.adminCode, km);
  }
  return [...best.entries()].sort((a, b) => a[1] - b[1]);
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    process.exit(1);
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stops?select=slug,name,city,state,latitude,longitude&limit=1000`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  const stops = await response.json();

  const suspect: string[] = [];

  for (const stop of stops) {
    const ranked = nearestPerState(stop.latitude, stop.longitude);
    if (ranked.length === 0) continue;

    const [closestState] = ranked[0];
    const other = ranked.find(([code]) => code !== stop.state);

    /*
      Two ways a row earns a look:
      the nearest town of all is in a different state to the label, or another
      state has a town almost as close, which means the point sits near a line.
    */
    const labelDisagrees = closestState !== stop.state;
    const nearBorder =
      other !== undefined &&
      other[1] < (ranked.find(([c]) => c === stop.state)?.[1] ?? Infinity) + 25;

    if (labelDisagrees || nearBorder) {
      const alternatives = ranked
        .slice(0, 3)
        .map(([code, km]) => `${code} ${km.toFixed(0)}km`)
        .join(", ");
      suspect.push(
        `  ${labelDisagrees ? "!" : "?"} ${stop.state}  ${stop.name.slice(0, 38).padEnd(40)} ${stop.city.slice(0, 18).padEnd(20)} ${alternatives}`,
      );
    }
  }

  console.log(`\n  ${stops.length} stops checked, ${suspect.length} worth a look\n`);
  console.log("  ! = nearest town is in a different state to the label");
  console.log("  ? = another state has a town almost as close\n");
  console.log(suspect.sort().join("\n"));
}

main();
