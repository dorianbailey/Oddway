/**
 * Talking to Overpass without getting blocked.
 *
 * Every rule here comes from a failure rather than a guess: a whole-state name
 * regex timed out, three states at once timed out, and rapid repeat queries
 * earned a 429. Overpass is a donated public resource with a handful of
 * servers; treating it gently is both required and decent.
 */

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Public instances, tried in order when one is busy. */
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

/** Overpass etiquette: one query at a time, with a pause between. */
export const REQUEST_DELAY_MS = 5_000;
export const MAX_ATTEMPTS = 4;

/**
 * Split a region into tiles.
 *
 * Smaller areas mean each query stays inside Overpass's time budget, and a
 * failure costs one tile rather than the whole run.
 */
export function tile(
  region: BoundingBox,
  sizeDegrees: number,
): BoundingBox[] {
  const tiles: BoundingBox[] = [];

  for (let south = region.south; south < region.north; south += sizeDegrees) {
    for (let west = region.west; west < region.east; west += sizeDegrees) {
      tiles.push({
        south,
        west,
        north: Math.min(south + sizeDegrees, region.north),
        east: Math.min(west + sizeDegrees, region.east),
      });
    }
  }

  return tiles;
}

/** Continental US, plus Alaska and Hawaii as separate regions. */
export const US_REGIONS: BoundingBox[] = [
  { south: 24.5, west: -125.0, north: 49.4, east: -66.9 },
  { south: 51.2, west: -179.9, north: 71.5, east: -129.9 },
  { south: 18.9, west: -160.3, north: 22.3, east: -154.8 },
];

export function bboxString(box: BoundingBox): string {
  return `${box.south},${box.west},${box.north},${box.east}`;
}

/** Build a tag-first query. Never regex names here — Overpass will time out. */
export function buildQuery(
  tags: string[],
  box: BoundingBox,
  timeoutSeconds = 90,
): string {
  const clauses = tags
    .map((tag) => `  nwr${tag}(${bboxString(box)});`)
    .join("\n");

  return `[out:json][timeout:${timeoutSeconds}];\n(\n${clauses}\n);\nout tags center;`;
}

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function coordinatesOf(
  element: OverpassElement,
): { latitude: number; longitude: number } | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return { latitude: lat, longitude: lon };
}

/**
 * Run one query, retrying with exponential backoff.
 *
 * 429 and 504 are the two Overpass returns under load, and both mean "wait",
 * not "give up". Each retry also moves to a different mirror.
 */
export async function runQuery(
  query: string,
  log: (message: string) => void = () => {},
): Promise<OverpassElement[]> {
  let lastError = "unknown";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass asks that clients identify themselves.
          "User-Agent": "OddWay/0.1 (roadside attraction index)",
        },
        body: "data=" + encodeURIComponent(query),
      });

      if (response.status === 429 || response.status === 504) {
        const wait = 15_000 * 2 ** attempt;
        log(`  ${response.status} from ${host(endpoint)}, waiting ${wait / 1000}s`);
        await sleep(wait);
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const text = await response.text();

      if (!text.trimStart().startsWith("{")) {
        lastError = `non-JSON from ${host(endpoint)} (HTTP ${response.status})`;
        log(`  ${lastError}`);
        await sleep(10_000);
        continue;
      }

      return (JSON.parse(text).elements ?? []) as OverpassElement[];
    } catch (error) {
      lastError = String(error).slice(0, 120);
      log(`  ${lastError}`);
      await sleep(10_000);
    }
  }

  throw new Error(`Overpass failed after ${MAX_ATTEMPTS} attempts: ${lastError}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function host(url: string): string {
  return new URL(url).host;
}

/** URL-safe slug, unique-ified by the caller if it collides. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Single-quote escaping for generated SQL. */
export function sqlString(value: string | null): string {
  if (value === null) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}
