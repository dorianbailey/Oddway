import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Articles are markdown files in `content/articles`, not database rows.
 *
 * Everything else in OddWay lives in Postgres, and this deliberately does not.
 * A stop is a record with a dozen short fields; an article is a thousand words
 * of prose that wants drafting, revising and version control. Writing that
 * through a SQL editor would be miserable, and a diff on a paragraph is far
 * more useful than a diff on a text column.
 */

const ARTICLES_DIR = join(process.cwd(), "content", "articles");

/**
 * Normalise a frontmatter date to ISO.
 *
 * YAML parses an unquoted `2026-09-02` into a Date object, so String() on it
 * yields "Wed Sep 02 2026 ...". Sorting those lexically orders articles by the
 * alphabetical order of their day names — Fri, Sat, Sun, Thu, Wed — which is
 * how the case study numbers ended up scrambled.
 */
function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "1970-01-01";
}

export interface Article {
  slug: string;
  title: string;
  /** One or two sentences for the index and the meta description. */
  summary: string;
  /** ISO date. Used for ordering and for the sitemap. */
  date: string;
  /** Optional: whose story this is, e.g. "cryptids". */
  category?: string;
  /** Slugs of stops this piece is about, linked at the foot of the page. */
  stops?: string[];
  /** Where the facts came from. Articles without sources do not publish. */
  sources?: string[];
  /** Path under /public, e.g. "/images/stories/bluff-creek.jpg". */
  hero?: string;
  /**
   * Credit line for the hero. Required whenever `hero` is set: almost every
   * usable image is licensed on condition of attribution, and an uncredited
   * one is a licence breach rather than an oversight.
   */
  heroCredit?: string;
  /** Rendered HTML body. */
  html: string;
  /** Rough reading time in minutes. */
  minutes: number;
  /**
   * Case study number. Assigned oldest-first, so an existing piece keeps its
   * number forever — publishing a new one does not renumber the archive.
   */
  caseNumber: number;
}

function parse(fileName: string): Article {
  const raw = readFileSync(join(ARTICLES_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const words = content.trim().split(/\s+/).length;

  return {
    slug: fileName.replace(/\.md$/, ""),
    title: String(data.title ?? "Untitled"),
    summary: String(data.summary ?? ""),
    date: toIsoDate(data.date),
    category: data.category ? String(data.category) : undefined,
    stops: Array.isArray(data.stops) ? data.stops.map(String) : undefined,
    sources: Array.isArray(data.sources) ? data.sources.map(String) : undefined,
    hero: data.hero ? String(data.hero) : undefined,
    heroCredit: data.heroCredit ? String(data.heroCredit) : undefined,
    html: marked.parse(content, { async: false }) as string,
    // 200 words a minute, rounded up. Nobody wants "0 min read".
    minutes: Math.max(1, Math.round(words / 200)),
    caseNumber: 0, // replaced in getArticles once the order is known
  };
}

/** Newest first. */
export function getArticles(): Article[] {
  let files: string[];
  try {
    files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const articles = files.map(parse);

  // Number by publication order, then present newest first.
  const oldestFirst = [...articles].sort((a, b) => a.date.localeCompare(b.date));
  const numbers = new Map(oldestFirst.map((a, i) => [a.slug, i + 1]));

  return articles
    .map((a) => ({ ...a, caseNumber: numbers.get(a.slug) ?? 0 }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticle(slug: string): Article | null {
  return getArticles().find((article) => article.slug === slug) ?? null;
}
