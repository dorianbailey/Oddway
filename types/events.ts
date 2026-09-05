export type EventCategory = "cryptid" | "ufo" | "paranormal";

/** Whether the date is announced or inferred from previous years. */
export type DateConfidence = "confirmed" | "estimated";

export interface OddEvent {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  /** Null until the geocoding pass runs. Distance needs these. */
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  category: EventCategory;
  /** First day of the run. Null when even the month is unknown. */
  startDate: string | null;
  /** How many days it runs, used to decide when it has finished. */
  days: number;
  /** The organisers' own phrasing, e.g. "first weekend of October". */
  displayDate: string | null;
  dateConfidence: DateConfidence;
  description: string | null;
  website: string | null;
  contact: string | null;
  notes: string | null;
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  cryptid: "Cryptid",
  ufo: "UFO",
  paranormal: "Paranormal",
};
