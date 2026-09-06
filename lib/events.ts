import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getSupabase } from "./supabase";
import type { EventCategory, OddEvent } from "@/types/events";

const COLUMNS =
  "id, name, slug, city, state, latitude, longitude, timezone, category, start_date, days, display_date, date_confidence, description, website, contact, notes";

interface EventRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  category: EventCategory;
  start_date: string | null;
  days: number;
  display_date: string | null;
  date_confidence: "confirmed" | "estimated";
  description: string | null;
  website: string | null;
  contact: string | null;
  notes: string | null;
}

function toEvent(row: EventRow): OddEvent {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    category: row.category,
    startDate: row.start_date,
    days: row.days,
    displayDate: row.display_date,
    dateConfidence: row.date_confidence,
    description: row.description,
    website: row.website,
    contact: row.contact,
    notes: row.notes,
  };
}

/**
 * Every event, alphabetical.
 *
 * Sorted by name rather than date on purpose: half the dates are estimates,
 * and ordering by a guess presents it as fact. Alphabetical is honest and is
 * also how someone looks for an event they already have in mind.
 */
/** Deduplicated per request, for the same reason as getStops. */
/** Cached across requests for the same reason as stops: distance, not payload. */
const fetchEvents = unstable_cache(
  async (): Promise<OddEvent[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select(COLUMNS)
    .order("name");

  if (error) {
    console.error("Supabase getEvents failed:", error.message);
    return [];
  }

    return data.map(toEvent);
  },
  ["events:all"],
  { revalidate: 60, tags: ["events"] },
);

export const getEvents = cache(fetchEvents);

/**
 * Has it finished?
 *
 * An event runs from start_date for `days` days, and counts as upcoming until
 * the last one is over — someone checking on the Saturday of a three-day
 * festival should still see it.
 */
export function hasFinished(event: OddEvent, today = new Date()): boolean {
  if (!event.startDate) return false;

  const end = new Date(`${event.startDate}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + Math.max(event.days, 1));

  const now = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  return end <= now;
}

/** Days until it starts. Negative once it has begun, null without a date. */
export function daysUntil(event: OddEvent, today = new Date()): number | null {
  if (!event.startDate) return null;

  const start = Date.parse(`${event.startDate}T00:00:00Z`);
  const now = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  return Math.round((start - now) / 86_400_000);
}

/** States that actually have events, with counts, for the filter. */
/** Events, plus whether the load actually worked. */
export async function loadEvents(): Promise<{
  events: OddEvent[];
  unavailable: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) return { events: [], unavailable: false };

  const events = await getEvents();
  return { events, unavailable: events.length === 0 };
}

export async function getEventStates(): Promise<
  Array<{ code: string; count: number }>
> {
  const events = await getEvents();
  const counts = new Map<string, number>();
  for (const event of events) {
    counts.set(event.state, (counts.get(event.state) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];
const ORDINALS = ["first", "second", "third", "fourth", "last"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface Recurrence {
  /** "the second Friday of June", for describing the pattern in prose. */
  pattern: string;
  /** Same position next year, as a date. An expectation, not a fixture. */
  nextDate: string;
}

/**
 * Work out when an event will probably fall next year.
 *
 * Festivals almost always repeat by position rather than by date — the second
 * weekend of June, the last Saturday of October — because organisers want a
 * weekend, and a fixed date drifts through the week. So the pattern is read
 * off the date we already have rather than stored separately, which means no
 * schema change and nothing extra to maintain.
 *
 * This is deliberately an expectation. It is never presented as a confirmed
 * date, because it isn't one: organisers move things, and an index that
 * printed a computed date as fact would send somebody on a wasted drive.
 */
export function likelyRecurrence(event: OddEvent): Recurrence | null {
  if (!event.startDate) return null;

  const start = new Date(`${event.startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return null;

  const month = start.getUTCMonth();
  const weekday = start.getUTCDay();
  const dayOfMonth = start.getUTCDate();

  // Which occurrence of this weekday within the month, and is it the last?
  const occurrence = Math.floor((dayOfMonth - 1) / 7);
  const isLast = dayOfMonth + 7 > daysInMonth(start.getUTCFullYear(), month);
  const ordinal = isLast ? "last" : ORDINALS[Math.min(occurrence, 3)];

  const nextYear = start.getUTCFullYear() + 1;
  const nextDate = nthWeekdayOf(nextYear, month, weekday, isLast ? -1 : occurrence);

  return {
    pattern: `the ${ordinal} ${WEEKDAYS[weekday]} of ${MONTHS[month]}`,
    nextDate: nextDate.toISOString().slice(0, 10),
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** `occurrence` counts from zero; -1 means the last one in the month. */
function nthWeekdayOf(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
): Date {
  if (occurrence === -1) {
    const last = new Date(Date.UTC(year, month + 1, 0));
    const shift = (last.getUTCDay() - weekday + 7) % 7;
    last.setUTCDate(last.getUTCDate() - shift);
    return last;
  }

  const first = new Date(Date.UTC(year, month, 1));
  const shift = (weekday - first.getUTCDay() + 7) % 7;
  first.setUTCDate(1 + shift + occurrence * 7);
  return first;
}
