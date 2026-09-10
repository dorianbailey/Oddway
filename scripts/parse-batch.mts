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

    const coords = lines.find((l) => /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(l));
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

    const labelled = (prefix: string) => {
      const line = lines.find((l) => l.toLowerCase().startsWith(prefix));
      if (!line) return null;
      const value = line.slice(line.indexOf(":") + 1).trim();
      return value.startsWith("http") ? value : null;
    };

    const [latRaw, lonRaw] = coords.split(",");
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

    const [city, rawState] = cityLine.split(/,\s*(?=[^,]*$)/);
    const state = STATE_NAMES[rawState.trim().toLowerCase()] ?? rawState.trim();
    if (state !== expectedState) {
      problems.push(`"${name}" says state ${state}, expected ${expectedState}`);
      continue;
    }

    const start = lines.indexOf(catLine) + 1;
    const description = lines
      .slice(start)
      .filter((l) => !/^(https?:|source:|website:|phone:|hours:|folklore|access source|additional|background|park:)/i.test(l))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    stops.push({
      name,
      city: city.trim(),
      state,
      lat: Number(latRaw),
      lon: Number(lonRaw),
      category: rawCategory,
      access,
      description,
      source: labelled("source:") ?? labelled("folklore source:")
        ?? lines.find((l) => l.startsWith("http")) ?? null,
      website: labelled("website:"),
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

  /*
    Both slug conventions are tested, because this project has used two — one
    turning an apostrophe into a dash, one removing it — and a duplicate
    horseshoe crab once walked straight between them.
  */
  const slugCollisions: string[] = [];
  for (const stop of incoming) {
    /*
      Both conventions are tried, but a name is only reported once. Most names
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
 * Proximity is a question rather than a verdict — two things can share a car
 * park — so those are printed and left to a person.
 */
export function reportBatch(label: string, report: BatchReport): void {
  const { slugCollisions, nearbyExisting, internalDuplicates, duplicateSlugsWithin } = report;

  console.log(`\n  ${label}`);
  console.log(`    slug collisions:       ${slugCollisions.length}`);
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
