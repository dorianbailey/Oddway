import { US_STATES } from "../lib/us-states";
import { readFileSync } from "node:fs";

/**
 * Reads a research batch into rows ready for SQL.
 *
 * Written after six states arrived at once. Every state so far has been parsed
 * with a slightly different throwaway script, which is how a stop got silently
 * dropped in Connecticut for having an access value nobody had seen before,
 * and how Blenheim Mineral Springs was very nearly lost in South Carolina.
 *
 * The rule here is that nothing is skipped in silence. Anything unrecognised
 * throws, with the stop named, so an unknown word is a five-second fix rather
 * than a missing place nobody notices for a month.
 */

/** Access words seen across every state so far, onto the five the schema has. */
const ACCESS_ALIASES: Record<string, string> = {
  "view-only": "roadside", "view only": "roadside", "exterior-only": "roadside",
  "exterior-view": "roadside", "roadside-view": "roadside", "boat-view": "roadside",
  "drive-by": "roadside", "street-view": "roadside",

  seasonal: "limited", "open-grounds": "limited", "seasonal-road": "limited",
  "by-appointment": "limited", "by appointment": "limited", appointment: "limited",
  hike: "limited", "remote-hike": "limited", remote: "limited",
  "boat-access": "limited", ticketed: "limited", "tour-only": "limited",
  reservation: "limited", "special-access": "limited", "event-only": "limited",
  "festival-only": "limited", "permission-required": "limited",
  "guided-tour": "limited", "tours-only": "limited", "paid-admission": "limited",

  "private-view": "private", "private-access": "private", "private-property": "private",

  "cemetery-hours": "open", "business-hours": "open", daylight: "open",
  "park-hours": "open", "campus-hours": "open", "church-hours": "open",
  "daylight-hours": "open", "public-hours": "open", free: "open",

  "permanently-closed": "closed", abandoned: "closed",
};
const VALID_ACCESS = new Set(["open", "limited", "roadside", "private", "closed"]);

/**
 * Spelled-out state names to their codes.
 *
 * Built from the site's own list rather than maintained here. A hand-written
 * lookup had nine states in it and rejected all 126 Wyoming stops for the
 * crime of writing "Wyoming" — which is a batch failing over a fact the
 * application already knows.
 */
const STATE_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATES).map(([code, name]) => [name.toLowerCase(), code]),
);

/**
 * Coordinates, in either shape a batch has used.
 *
 * Nine formats in, every file had written the pair on one line. Nevada's 153
 * arrived with them labelled on two:
 *
 *   Latitude: 36.17669
 *   Longitude: -115.13521
 *
 * The pair is still tried first, so nothing about the nine earlier formats
 * changes: a file that has a bare pair never reaches the labelled branch.
 *
 * Labels are read loosely — "Lat"/"Long"/"Lng", either order, colon or equals
 * — because the next file to use them will not match Nevada's spelling exactly
 * and rejecting 153 stops over "Long:" is the Montana failure again.
 *
 * Hemisphere letters are handled rather than ignored. "Longitude: 115.13521 W"
 * read as a bare number puts a Nevada stop in central China, and nothing about
 * that is visible: the row inserts, the page renders, and the stop simply never
 * appears near any route. Anything not understood returns null and the block is
 * reported as missing coordinates, which is the loud failure.
 */
const DECIMAL = String.raw`-?\d+(?:\.\d+)?`;
const PAIR_RE = new RegExp(
  `^(?:coord(?:inate)?s?\\s*[:=]\\s*)?(-?\\d+\\.\\d+)\\s*,\\s*(-?\\d+\\.\\d+)$`,
  "i",
);
const LAT_RE = new RegExp(`^(?:latitude|lat)\\s*[:=]\\s*(${DECIMAL})\\s*([NS])?$`, "i");
const LON_RE = new RegExp(`^(?:longitude|long|lng|lon)\\s*[:=]\\s*(${DECIMAL})\\s*([EW])?$`, "i");

function hemisphere(value: string, letter: string | undefined, negative: string): number {
  const n = Number(value);
  if (!letter) return n;
  return letter.toUpperCase() === negative ? -Math.abs(n) : Math.abs(n);
}

export function readCoordinates(lines: string[]): { lat: number; lon: number } | null {
  for (const line of lines) {
    const pair = line.match(PAIR_RE);
    if (pair) return { lat: Number(pair[1]), lon: Number(pair[2]) };
  }

  let lat: number | null = null;
  let lon: number | null = null;
  for (const line of lines) {
    const a = line.match(LAT_RE);
    if (a && lat === null) lat = hemisphere(a[1], a[2], "S");
    const b = line.match(LON_RE);
    if (b && lon === null) lon = hemisphere(b[1], b[2], "W");
  }
  if (lat === null || lon === null) return null;
  return { lat, lon };
}

/**
 * Whether a coordinate could be a stop in the expected state.
 *
 * Not a bounding box — this only catches the errors that produce a number the
 * parser is perfectly happy with and a pin on the wrong continent. A dropped
 * minus sign and a swapped pair are both ordinary research slips, and both are
 * invisible afterwards: no error, no 404, just a stop that is never near
 * anybody's route.
 *
 * The Aleutians cross the antimeridian, so Alaska is the one state where a
 * positive longitude is real.
 */
export function coordinateProblem(
  lat: number,
  lon: number,
  expectedState: string,
): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "coordinates are not numbers";
  if (Math.abs(lat) > 90) {
    return `latitude ${lat} is out of range — latitude and longitude may be swapped`;
  }
  if (Math.abs(lon) > 180) return `longitude ${lon} is out of range`;
  if (lat === 0 && lon === 0) return "coordinates are 0, 0";
  if (lon > 0 && expectedState !== "AK") {
    return `longitude ${lon} is positive, which is not in ${expectedState} — a dropped minus sign?`;
  }
  return null;
}

export interface ParsedStop {
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  category: string;
  access: string;
  description: string;
  source: string | null;
  website: string | null;
}

export function parseBatch(path: string, expectedState: string): ParsedStop[] {
  const text = readFileSync(path, "utf8");
  const stops: ParsedStop[] = [];
  const problems: string[] = [];

  /*
    Split on numbered headings as well as blank lines.

    Two Mississippi stops were lost because whoever assembled the file omitted
    one blank line, which glued each of them onto the entry above. The merged
    block still parsed — the first stop's coordinates and category were found
    — so nothing looked wrong and the second stop simply ceased to exist.

    Blank lines are a formatting convention and will be got wrong again. A
    line starting "46. " after a source line is unambiguously a new entry.
  */
  const blocks = text
    .replace(/\n(?=\d+\.\s+\S)/g, "\n\n")
    .split("\n\n")
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 5) continue;

    const coords = readCoordinates(lines);
    /*
      Digits are allowed in a category because "route-66" is one, and the
      pattern that excluded them lost thirteen Illinois stops.
    */
    /*
      Categories arrive hyphenated in most batches and spaced in others —
      "ghost-town" against "ghost town". Both are read, and the spaces are
      turned into hyphens below so the mapping only has to know one spelling.

      Montana came in spaced and this pattern rejected 106 of its 120 stops.
      They were not lost, because the parser refuses rather than skipping, but
      an import that fails outright over a space is worth avoiding.

      Case is ignored and ampersands allowed for the same reason: "Indigenous
      history" and "rock art & expedition history" are perfectly good category
      names and rejecting them over a capital letter helps nobody.

      Slashes appear too, as a compound: "memorial / mining history", or an
      access of "open / seasonal". The first half is taken in both cases —
      whoever wrote it put the more important one first, and the schema only
      has room for one.
    */
    const catLine = lines.find((l) => /^[a-z0-9 &/-]+ \| [a-z][a-z /\u2014-]*$/i.test(l));
    const cityLine = lines.find((l) => /,\s*([A-Z]{2}|[A-Z][a-z]+( [A-Z][a-z]+)?)$/.test(l));

    if (!coords || !catLine || !cityLine) {
      /*
        A block that does not match at all is the dangerous case, and the first
        version of this file skipped it in silence — which lost thirteen
        Illinois stops and two from Mississippi without a word, in the very
        parser written to stop that happening.

        Headers and access keys are legitimately not stops, so they are ignored
        by shape: a real entry has a name, a coordinate pair and a category
        line. Anything with some of those and not others is a malformed stop
        and worth shouting about.
      */
      const looksLikeAStop = Boolean(coords) || Boolean(catLine);
      if (looksLikeAStop) {
        problems.push(
          `"${lines[0].slice(0, 46)}" is missing ` +
            [!coords && "coordinates", !catLine && "category | access", !cityLine && "city, state"]
              .filter(Boolean)
              .join(" and "),
        );
      }
      continue;
    }

    /*
      A source is not always a link. Competing guides are credited by name and
      never linked, so "Source: Atlas Obscura" has to survive as the string
      "Atlas Obscura" rather than being discarded for failing to be a URL.

      It was discarded. The line matched, the value was thrown away for not
      starting with http, and the stop arrived with no source at all — the
      credit gone and nothing to show it had ever been there.

      A website is different and keeps the URL test, because a website that is
      not a URL is nothing.
    */
    const labelled = (prefix: string) => {
      const line = lines.find((l) => l.toLowerCase().startsWith(prefix));
      if (!line) return null;
      return line.slice(line.indexOf(":") + 1).trim() || null;
    };

    const labelledUrl = (prefix: string) => {
      const value = labelled(prefix);
      return value?.startsWith("http") ? value : null;
    };

    const [rawCategoryText, rawAccessText] = catLine.split("|").map((v) => v.trim());
    /*
      A compound keeps its first half: "open / seasonal" is open. An em dash
      does the same job — "limited — verify reopening" is limited, and the
      caveat belongs in the description where a traveller will read it.
    */
    const rawAccess = rawAccessText.split(/[/\u2014]/)[0].trim();
    // "ghost town" and "ghost-town" are the same category.
    const rawCategory = rawCategoryText
      .split("/")[0]
      .trim()
      .toLowerCase()
      // "rock art & expedition history" becomes rock-art-expedition-history.
      .replace(/\s*&\s*/g, "-")
      .replace(/\s+/g, "-");
    const access = ACCESS_ALIASES[rawAccess] ?? rawAccess;

    const name = lines[0].replace(/^\d+\.\s*/, "").trim();

    if (!VALID_ACCESS.has(access)) {
      problems.push(`unknown access "${rawAccess}" on "${name}"`);
      continue;
    }

    const badCoordinate = coordinateProblem(coords.lat, coords.lon, expectedState);
    if (badCoordinate) {
      problems.push(`"${name}": ${badCoordinate}`);
      continue;
    }

    const [city, rawState] = cityLine.split(/,\s*(?=[^,]*$)/);
    const state = STATE_NAMES[rawState.trim().toLowerCase()] ?? rawState.trim();
    if (state !== expectedState) {
      problems.push(`"${name}" says state ${state}, expected ${expectedState}`);
      continue;
    }

    const start = lines.indexOf(catLine) + 1;
    const description = lines
      .slice(start)
      /*
        Labelled coordinates are excluded here as well as read above. They sit
        before the category line in Nevada's file so they never reach this
        slice — but a file that puts them after it would fold "Longitude:
        -115.13521" into the prose a traveller reads, and that is the kind of
        thing nobody notices until it is on the live site.
      */
      .filter((l) => !/^(https?:|source:|website:|phone:|hours:|folklore|access source|additional|background|park:|lat(itude)?\s*[:=]|lon(gitude)?\s*[:=]|lng\s*[:=]|coord(inate)?s?\s*[:=])/i.test(l))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    stops.push({
      name,
      city: city.trim(),
      state,
      lat: coords.lat,
      lon: coords.lon,
      category: rawCategory,
      access,
      description,
      source: labelled("source:") ?? labelled("folklore source:")
        ?? lines.find((l) => l.startsWith("http")) ?? null,
      website: labelledUrl("website:"),
    });
  }

  if (problems.length) {
    throw new Error(
      `${path}: ${problems.length} rows could not be read.\n  ` +
        problems.join("\n  "),
    );
  }

  return stops;
}

/** Metres between two points. */
export function metresBetween(
  aLat: number, aLon: number, bLat: number, bLon: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Both slug conventions this project has used, so a collision cannot hide. */
export function slugVariants(name: string): string[] {
  const base = name.toLowerCase().replace(/[\u2019]/g, "'").replace(/[\u2014\u2013]/g, "-");
  return [
    base.replace(/['&:.,!?\u201c\u201d]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80),
    base.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80),
  ];
}

export const slugify = (name: string) => slugVariants(name)[0];


/**
 * Everything a batch must survive before it becomes SQL.
 *
 * This exists because the six-state import skipped it. That run checked
 * incoming slugs against each other and incoming coordinates against the forty
 * existing stops in those six states — but never incoming slugs against the
 * whole database, which is the one check that has caught something in every
 * single state.
 *
 * Two stops paid for it. Wisconsin's Crystal Cave took the slug held by the
 * cave at Put-in-Bay, Ohio; Illinois' Smiley Face Water Tower took Ashley,
 * Indiana's. The upsert updated those rows instead of inserting, so an Ohio
 * cave described a Wisconsin one and two states were quietly a stop short.
 * Nothing errored.
 *
 * The lesson was not "be more careful". It was that a check living in a script
 * rewritten for each import is a check that will eventually be rewritten
 * without. So it lives here, and generating SQL without calling it is the
 * awkward path rather than the easy one.
 */
export interface BatchReport {
  slugCollisions: string[];
  nearbyExisting: string[];
  internalDuplicates: string[];
  duplicateSlugsWithin: string[];
}

export interface ExistingStop {
  slug: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export function checkBatch(
  incoming: ParsedStop[],
  existing: ExistingStop[],
  { metres = 400 }: { metres?: number } = {},
): BatchReport {
  const bySlug = new Map(existing.map((s) => [s.slug, s]));

  const slugCollisions: string[] = [];
  for (const stop of incoming) {
    /*
      Both slug conventions are tried, but a name is reported once. Most names
      produce the same slug either way, so reporting per variant would list
      every collision twice and make a count of two look like four.
    */
    const variants = [...new Set(slugVariants(stop.name))];
    const clash = variants.map((v) => bySlug.get(v)).find(Boolean);
    if (clash) {
      slugCollisions.push(
        `"${stop.name}" (${stop.city}, ${stop.state}) collides with ` +
          `"${clash.name}" (${clash.city}, ${clash.state})`,
      );
    }
  }

  const nearbyExisting: string[] = [];
  for (const stop of incoming) {
    for (const other of existing) {
      const d = metresBetween(stop.lat, stop.lon, other.latitude, other.longitude);
      if (d < metres) {
        nearbyExisting.push(
          `${Math.round(d)}m: "${stop.name}" / existing "${other.name}" (${other.state})`,
        );
      }
    }
  }

  const internalDuplicates: string[] = [];
  for (let i = 0; i < incoming.length; i += 1) {
    for (let j = i + 1; j < incoming.length; j += 1) {
      const d = metresBetween(incoming[i].lat, incoming[i].lon, incoming[j].lat, incoming[j].lon);
      if (d < 60) {
        internalDuplicates.push(
          `${Math.round(d)}m: "${incoming[j].name}" / "${incoming[i].name}"`,
        );
      }
    }
  }

  const seen = new Map<string, number>();
  for (const stop of incoming) {
    const slug = slugVariants(stop.name)[0];
    seen.set(slug, (seen.get(slug) ?? 0) + 1);
  }
  const duplicateSlugsWithin = [...seen].filter(([, n]) => n > 1).map(([s]) => s);

  return { slugCollisions, nearbyExisting, internalDuplicates, duplicateSlugsWithin };
}

/**
 * Prints a report and refuses to continue on the findings that are never
 * acceptable.
 *
 * A slug collision is always wrong: it silently rewrites somebody else's stop.
 * Proximity and similar names are questions rather than verdicts — two things
 * can share a car park — so those are printed and left to a person.
 */
export function reportBatch(label: string, report: BatchReport): void {
  const { slugCollisions, nearbyExisting, internalDuplicates, duplicateSlugsWithin } = report;

  console.log(`\n  ${label}`);
  console.log(`    slug collisions:        ${slugCollisions.length}`);
  console.log(`    duplicate slugs within: ${duplicateSlugsWithin.length}`);
  console.log(`    near an existing stop:  ${nearbyExisting.length}`);
  console.log(`    near each other:        ${internalDuplicates.length}`);

  for (const line of nearbyExisting) console.log(`      ? ${line}`);
  for (const line of internalDuplicates) console.log(`      ? ${line}`);

  if (slugCollisions.length || duplicateSlugsWithin.length) {
    for (const line of slugCollisions) console.log(`      ! ${line}`);
    for (const slug of duplicateSlugsWithin) console.log(`      ! ${slug} appears twice in this batch`);
    throw new Error(
      `${label}: ${slugCollisions.length + duplicateSlugsWithin.length} slug ` +
        `collisions. Rename them before generating SQL — an upsert would ` +
        `overwrite the existing stop rather than insert a new one.`,
    );
  }
}

const ARTICLES = new Set(["the", "and", "for", "with"]);

/**
 * Words too common to make a match interesting on their own.
 *
 * Used to judge whether an overlap is worth reporting, not to remove words
 * before comparing. Removing them first was the first attempt at this, and it
 * compared two names on different bases: "Ghost Town Museum" lost every word
 * it had while "Ghost Town Wild West Museum" kept two, so they shared nothing
 * and the duplicate this exists to catch went through anyway.
 */
const COMMON_WORDS = new Set([
  "museum", "monument", "memorial", "park", "site", "historic", "historical",
  "national", "state", "county", "city", "town", "village", "center", "centre",
  "tour", "tours", "ghost", "old", "new", "great", "trail", "house", "hall",
  "world", "worlds", "largest", "smallest", "original",
]);

function nameWords(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !ARTICLES.has(w));
}

/**
 * Incoming stops whose names look like something already in the same state.
 *
 * Three states running, a duplicate slipped past both the slug check and the
 * position check, because the stop was already in the index under a different
 * name AND with a scan coordinate wrong by hundreds of metres:
 *
 *   Ghost Town Museum       vs Ghost Town Wild West Museum        1.4km
 *   Vulture City Ghost Town vs Vulture Mine Tours / Vulture City   978m
 *   Sasquatch Outpost       vs Sasquatch Outpost & Encounter...    686m
 *
 * Every one has the same shape: one place written at two lengths, so the
 * shorter name's words are a subset of the longer one's. That is what this
 * looks for.
 *
 * Deliberately noisy. It asks a question rather than passing a verdict, and a
 * few false flags a state is a fair price for the ones both other checks miss.
 */
export function similarlyNamed(
  incoming: ParsedStop[],
  existing: ExistingStop[],
): string[] {
  const flags: string[] = [];
  const sameState = existing.filter((e) => e.state === incoming[0]?.state);

  for (const stop of incoming) {
    const mine = nameWords(stop.name);
    if (mine.length === 0) continue;

    for (const other of sameState) {
      const theirs = nameWords(other.name);
      if (theirs.length === 0) continue;

      const [shorter, longer] =
        mine.length <= theirs.length ? [mine, theirs] : [theirs, mine];
      const longerSet = new Set(longer);
      if (!shorter.every((word) => longerSet.has(word))) continue;

      /*
        A match made only of common words needs length to be worth reporting.
        "Ghost Town Museum" is three words and worth a look; "Old Park" is two
        and would flag every county park in the state.
      */
      const hasDistinctive = shorter.some((word) => !COMMON_WORDS.has(word));
      if (!hasDistinctive && shorter.length < 3) continue;

      const metres = Math.round(
        metresBetween(stop.lat, stop.lon, other.latitude, other.longitude),
      );
      flags.push(
        `"${stop.name}" / existing "${other.name}" — shared: ${shorter.join(" ")} — ${metres}m apart`,
      );
    }
  }

  return flags;
}
