import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Ready-made road trips: an ordered list of stops with a reason for the order.
 *
 * Stored as markdown for the same reason articles are — a trip is mostly prose
 * about why these places belong together, and that wants drafting rather than
 * a SQL editor. The stops themselves are referenced by slug and read from the
 * database at request time, so a trip can never drift out of sync with the
 * index: rename or close a stop and the trip page reflects it.
 */

const TRIPS_DIR = join(process.cwd(), "content", "trips");

export interface Trip {
  slug: string;
  title: string;
  summary: string;
  /** Ordered stop slugs. The order is the route. */
  stops: string[];
  /** Rough driving days, as the author judges it. */
  days?: number;
  /** Where it starts and ends, in words. */
  startsAt?: string;
  endsAt?: string;
  html: string;
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "1970-01-01";
}

function parse(fileName: string): Trip {
  const raw = readFileSync(join(TRIPS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  return {
    slug: fileName.replace(/\.md$/, ""),
    title: String(data.title ?? "Untitled"),
    summary: String(data.summary ?? ""),
    stops: Array.isArray(data.stops) ? data.stops.map(String) : [],
    days: data.days ? Number(data.days) : undefined,
    startsAt: data.startsAt ? String(data.startsAt) : undefined,
    endsAt: data.endsAt ? String(data.endsAt) : undefined,
    html: marked.parse(content, { async: false }) as string,
  };
}

export function getTrips(): Trip[] {
  let files: string[];
  try {
    files = readdirSync(TRIPS_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files.map(parse).sort((a, b) => a.title.localeCompare(b.title));
}

export function getTrip(slug: string): Trip | null {
  return getTrips().find((trip) => trip.slug === slug) ?? null;
}

export { toIsoDate };
