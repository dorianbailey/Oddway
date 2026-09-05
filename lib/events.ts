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
export async function getEvents(): Promise<OddEvent[]> {
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
}

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
