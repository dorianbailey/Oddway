import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Artists working on cryptids, folklore and roadside strangeness.
 *
 * Markdown files, like stories and trips, because a profile is prose about
 * somebody's work rather than a record with fields.
 *
 * Note the links here point outward on purpose. Elsewhere in this index a link
 * to another site is weighed carefully — a citation to a rival travel guide
 * costs a click and gives the reader nothing. Here the outward link is the
 * whole feature: the point of the page is to send people to the shop.
 */

const ARTISTS_DIR = join(process.cwd(), "content", "artists");

export interface ArtistLink {
  label: string;
  href: string;
}

export interface Artist {
  slug: string;
  name: string;
  /** One line for the index and the featured card. */
  summary: string;
  /** Where they work from, if they have said. */
  location?: string;
  /** "Linocut and screenprint", "Soft sculpture", and so on. */
  medium?: string;
  /** Shop, site, socials. Order is the order shown. */
  links: ArtistLink[];
  /** Path under /public, with a credit line. */
  image?: string;
  imageCredit?: string;
  /**
   * Whether the artist has agreed to be featured.
   *
   * Required, and profiles without it are never shown. Featuring somebody's
   * work without asking is the kind of favour nobody wants doing for them, and
   * the cost of being wrong falls entirely on them.
   *
   * It also covers the words. An artist who has agreed to be listed has not
   * necessarily agreed to a description of their work written by somebody
   * else — worth their reading it first, and worth more than that for anybody
   * who has said publicly how they feel about how such text gets written.
   */
  permission: boolean;
  /**
   * Position in the rotation.
   *
   * Explicit rather than alphabetical, because the order artists are featured
   * in is an editorial decision — somebody who has just agreed to it should
   * not wait until the letter Y comes round. Lower goes first; ties fall back
   * to the name so the order is never ambiguous.
   */
  featureOrder: number;
  html: string;
}

function parse(fileName: string): Artist {
  const raw = readFileSync(join(ARTISTS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  const links: ArtistLink[] = Array.isArray(data.links)
    ? data.links
        .map((l: { label?: string; href?: string }) => ({
          label: String(l?.label ?? ""),
          href: String(l?.href ?? ""),
        }))
        .filter((l) => l.label && /^https?:\/\//i.test(l.href))
    : [];

  return {
    slug: fileName.replace(/\.md$/, ""),
    name: String(data.name ?? "Unnamed"),
    summary: String(data.summary ?? ""),
    location: data.location ? String(data.location) : undefined,
    medium: data.medium ? String(data.medium) : undefined,
    links,
    image: data.image ? String(data.image) : undefined,
    imageCredit: data.imageCredit ? String(data.imageCredit) : undefined,
    permission: data.permission === true,
    featureOrder:
      typeof data.featureOrder === "number"
        ? data.featureOrder
        : Number.MAX_SAFE_INTEGER,
    html: marked.parse(content, { async: false }) as string,
  };
}

/** Only artists who have agreed to appear. */
export function getArtists(): Artist[] {
  let files: string[];
  try {
    files = readdirSync(ARTISTS_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files
    .map(parse)
    .filter((artist) => artist.permission)
    .sort(
      (a, b) =>
        a.featureOrder - b.featureOrder || a.name.localeCompare(b.name),
    );
}

export function getArtist(slug: string): Artist | null {
  return getArtists().find((artist) => artist.slug === slug) ?? null;
}

/**
 * The Wednesday that the current feature week began, in Eastern time.
 *
 * Eastern rather than UTC because that is where the site is run from and when
 * a person would expect the change to happen. Doing it properly means the
 * switch stays at nine in the morning through the clocks changing, rather than
 * drifting to eight or ten for half the year.
 *
 * Intl is used to read the Eastern wall clock for a given instant, which is
 * the only way to get this right without a timezone library.
 */
function easternParts(at: Date): { year: number; month: number; day: number; hour: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    weekday: "short",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(at).map((p) => [p.type, p.value]),
  );

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // 24 comes back for midnight in some environments.
    hour: Number(parts.hour) % 24,
    weekday: weekdays.indexOf(parts.weekday as string),
  };
}

/**
 * How many feature weeks have passed since the rotation began.
 *
 * Counted from Wednesday 9 September 2026 at nine in the morning Eastern,
 * which is the week Douglas Bailey was first featured. Anything before that
 * anchor returns zero rather than a negative, so the first artist stays put
 * rather than the list running backwards.
 */
function weeksSinceAnchor(now: Date): number {
  const { year, month, day, hour, weekday } = easternParts(now);

  /*
    Days back to the most recent Wednesday. Before nine on a Wednesday the
    week has not turned over yet, so it counts as the previous one — which is
    what somebody looking at the site at eight in the morning would expect.
  */
  let back = (weekday - 3 + 7) % 7;
  if (weekday === 3 && hour < 9) back = 7;

  const thisWeek = Date.UTC(year, month - 1, day) - back * 86_400_000;
  const anchor = Date.UTC(2026, 8, 9); // 9 September 2026

  return Math.max(0, Math.round((thisWeek - anchor) / (7 * 86_400_000)));
}

/**
 * This week's featured artist.
 *
 * Derived from the date rather than stored, so nothing runs on a schedule and
 * every server picks the same person. Changes every Wednesday at nine in the
 * morning Eastern, working down the list in featureOrder and starting again at
 * the top once it reaches the end.
 */
export function getFeaturedArtist(today = new Date()): Artist | null {
  const artists = getArtists();
  if (artists.length === 0) return null;

  return artists[weeksSinceAnchor(today) % artists.length];
}

/** When the feature next changes. Useful for saying so on the page. */
export function nextRotation(today = new Date()): Date {
  const { year, month, day, hour, weekday } = easternParts(today);

  let forward = (3 - weekday + 7) % 7;
  if (forward === 0 && hour >= 9) forward = 7;

  // Nine Eastern is 13:00 or 14:00 UTC depending on the season; building the
  // date this way lets the runtime work that out rather than guessing.
  const target = new Date(Date.UTC(year, month - 1, day + forward, 13, 0, 0));
  return target;
}
