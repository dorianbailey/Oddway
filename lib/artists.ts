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
   */
  permission: boolean;
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
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getArtist(slug: string): Artist | null {
  return getArtists().find((artist) => artist.slug === slug) ?? null;
}

/**
 * This week's featured artist.
 *
 * Derived from the date rather than stored, so nothing has to run on a
 * schedule and the choice is identical on every server. Weeks are counted from
 * the Unix epoch in UTC, which means the change happens at midnight UTC on a
 * Thursday — arbitrary, but consistent, and nobody has to remember to do it.
 */
export function getFeaturedArtist(today = new Date()): Artist | null {
  const artists = getArtists();
  if (artists.length === 0) return null;

  const days = Math.floor(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) /
      86_400_000,
  );
  const week = Math.floor(days / 7);

  return artists[week % artists.length];
}
