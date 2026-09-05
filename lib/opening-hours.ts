/**
 * OpenStreetMap `opening_hours` formatting.
 *
 * The full specification is enormous — it covers sunset offsets, school
 * holidays, week numbers and nested conditionals. This handles the common
 * subset that covers most museums and attractions, and passes anything it
 * doesn't understand through unchanged rather than guessing.
 *
 * Deliberately does NOT compute an "open now" badge. Doing that correctly
 * requires public holiday calendars and the venue's timezone; getting it wrong
 * sends somebody on a two-hour drive to a locked door. Showing the schedule and
 * letting a person read it is the honest option.
 *
 * Data is from OpenStreetMap, licensed ODbL, which permits storage and reuse
 * with attribution.
 */

const DAY_NAMES: Record<string, string> = {
  mo: "Monday",
  tu: "Tuesday",
  we: "Wednesday",
  th: "Thursday",
  fr: "Friday",
  sa: "Saturday",
  su: "Sunday",
};

const SHORT_DAYS: Record<string, string> = {
  mo: "Mon",
  tu: "Tue",
  we: "Wed",
  th: "Thu",
  fr: "Fri",
  sa: "Sat",
  su: "Sun",
};

export interface OpeningHoursRule {
  /** e.g. "Mon–Thu" or "Sunday". Empty when the rule has no day part. */
  days: string;
  /** e.g. "10:00 – 17:00", or "Closed". */
  times: string;
}

export interface ParsedOpeningHours {
  /** Weekly schedule, in the order the tag lists it. */
  rules: OpeningHoursRule[];
  /** Exceptions we recognised but did not turn into a weekly rule. */
  notes: string[];
  /** True when the tag was `24/7`. */
  alwaysOpen: boolean;
  /** Set when nothing could be parsed; render this instead. */
  raw: string | null;
}

export function parseOpeningHours(value: string): ParsedOpeningHours {
  const trimmed = value.trim();

  if (!trimmed) {
    return { rules: [], notes: [], alwaysOpen: false, raw: null };
  }

  if (trimmed === "24/7") {
    return { rules: [], notes: [], alwaysOpen: true, raw: null };
  }

  const rules: OpeningHoursRule[] = [];
  const notes: string[] = [];
  let understoodAny = false;

  for (const segment of trimmed.split(";")) {
    const part = segment.trim();
    if (!part) continue;

    const match = /^([A-Za-z,\-]+)\s+(.+)$/.exec(part);

    if (match && isDaySpec(match[1])) {
      rules.push({ days: formatDays(match[1]), times: formatTimes(match[2]) });
      understoodAny = true;
      continue;
    }

    // Things like "Dec 25 off" or "easter off" — real information, but not a
    // weekly rule. Surface it rather than silently dropping it.
    notes.push(capitalise(part));
  }

  if (!understoodAny) {
    return { rules: [], notes: [], alwaysOpen: false, raw: trimmed };
  }

  return { rules, notes, alwaysOpen: false, raw: null };
}

/** Only treat it as days if every token is a weekday abbreviation. */
function isDaySpec(spec: string): boolean {
  const tokens = spec.split(/[,\-]/).filter(Boolean);
  return (
    tokens.length > 0 &&
    tokens.every((token) => token.toLowerCase() in DAY_NAMES)
  );
}

function formatDays(spec: string): string {
  return spec
    .split(",")
    .map((chunk) => {
      const range = chunk.split("-");

      if (range.length === 2) {
        const from = SHORT_DAYS[range[0].toLowerCase()];
        const to = SHORT_DAYS[range[1].toLowerCase()];
        return from && to ? `${from}\u2013${to}` : chunk;
      }

      return DAY_NAMES[chunk.toLowerCase()] ?? chunk;
    })
    .join(", ");
}

function formatTimes(spec: string): string {
  const value = spec.trim();

  if (/^off$/i.test(value) || /^closed$/i.test(value)) return "Closed";

  return value
    .split(",")
    .map((range) => range.trim().replace(/-/g, " \u2013 "))
    .join(", ");
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ------------------------------------------------------------------------ */
/* Open now                                                                  */
/* ------------------------------------------------------------------------ */

export type OpenState = "open" | "closed" | "unknown";

export interface OpenNowResult {
  state: OpenState;
  /** "Closes 17:00" or "Opens 10:00 Thu". Null when state is unknown. */
  detail: string | null;
  /**
   * Set when a rule exists that we could not evaluate — a holiday closure, a
   * seasonal range. The schedule may say open while the door is locked, so the
   * UI must soften the claim rather than assert it.
   */
  caveat: string | null;
}

const DAY_ORDER = ["su", "mo", "tu", "we", "th", "fr", "sa"] as const;

/**
 * Is it open right now?
 *
 * Evaluated in the venue's own timezone, which is why `timezone` is required
 * rather than optional — using the visitor's clock would tell someone in
 * California that a West Virginia museum is open three hours after it shut.
 *
 * Returns "unknown" rather than guessing whenever the tag contains anything
 * this parser does not fully understand. A wrong "Open now" is worse than no
 * badge at all.
 */
export function evaluateOpenNow(
  value: string | null,
  timezone: string | null,
  now: Date = new Date(),
): OpenNowResult {
  if (!value || !timezone) {
    return { state: "unknown", detail: null, caveat: null };
  }

  const trimmed = value.trim();

  if (trimmed === "24/7") {
    return { state: "open", detail: "Open at any time", caveat: null };
  }

  let local: LocalTime;
  try {
    local = localTimeIn(timezone, now);
  } catch {
    return { state: "unknown", detail: null, caveat: null };
  }

  const schedule = new Map<string, Array<[number, number]>>();
  let caveat: string | null = null;

  for (const segment of trimmed.split(";")) {
    const part = segment.trim();
    if (!part) continue;

    const match = /^([A-Za-z,\-]+)\s+(.+)$/.exec(part);

    if (!match || !isDaySpec(match[1])) {
      // A date-based or seasonal rule. We cannot evaluate it, but it might
      // close the place today, so record the doubt.
      caveat = "Holiday and seasonal closures apply";
      continue;
    }

    const days = expandDays(match[1]);
    const times = match[2].trim();

    if (/^(off|closed)$/i.test(times)) {
      for (const day of days) schedule.set(day, []);
      continue;
    }

    const ranges = parseRanges(times);
    if (ranges === null) {
      return { state: "unknown", detail: null, caveat: null };
    }
    for (const day of days) schedule.set(day, ranges);
  }

  if (schedule.size === 0) {
    return { state: "unknown", detail: null, caveat: null };
  }

  const todayKey = DAY_ORDER[local.weekday];
  const minutes = local.hour * 60 + local.minute;

  // Yesterday's overnight range may still be running (22:00-02:00).
  const yesterdayKey = DAY_ORDER[(local.weekday + 6) % 7];
  for (const [start, end] of schedule.get(yesterdayKey) ?? []) {
    if (end <= start && minutes < end) {
      return { state: "open", detail: `Closes ${toClock(end)}`, caveat };
    }
  }

  for (const [start, end] of schedule.get(todayKey) ?? []) {
    const spansMidnight = end <= start;
    if (minutes >= start && (spansMidnight || minutes < end)) {
      return { state: "open", detail: `Closes ${toClock(end)}`, caveat };
    }
  }

  return { state: "closed", detail: nextOpening(schedule, local), caveat };
}

interface LocalTime {
  /** 0 = Sunday, matching DAY_ORDER. */
  weekday: number;
  hour: number;
  minute: number;
}

/** The wall clock at the venue, without pulling in a timezone library. */
function localTimeIn(timezone: string, now: Date): LocalTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekday = DAY_ORDER.indexOf(
    get("weekday").slice(0, 2).toLowerCase() as (typeof DAY_ORDER)[number],
  );
  if (weekday < 0) throw new Error("Unrecognised weekday");

  // Intl renders midnight as "24" in some environments.
  const hour = Number(get("hour")) % 24;

  return { weekday, hour, minute: Number(get("minute")) };
}

function expandDays(spec: string): string[] {
  const days: string[] = [];

  for (const chunk of spec.split(",")) {
    const range = chunk.split("-").map((d) => d.trim().toLowerCase());

    if (range.length === 2) {
      const from = DAY_ORDER.indexOf(range[0] as (typeof DAY_ORDER)[number]);
      const to = DAY_ORDER.indexOf(range[1] as (typeof DAY_ORDER)[number]);
      if (from < 0 || to < 0) continue;
      for (let i = from; ; i = (i + 1) % 7) {
        days.push(DAY_ORDER[i]);
        if (i === to) break;
      }
    } else if (DAY_ORDER.includes(range[0] as (typeof DAY_ORDER)[number])) {
      days.push(range[0]);
    }
  }

  return days;
}

/** "10:00-17:00,18:00-20:00" -> [[600,1020],[1080,1200]]. Null if malformed. */
function parseRanges(spec: string): Array<[number, number]> | null {
  const ranges: Array<[number, number]> = [];

  for (const chunk of spec.split(",")) {
    const match = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(
      chunk.trim(),
    );
    if (!match) return null;

    const start = Number(match[1]) * 60 + Number(match[2]);
    const end = Number(match[3]) * 60 + Number(match[4]);
    if (start > 1440 || end > 1440) return null;

    ranges.push([start, end]);
  }

  return ranges.length > 0 ? ranges : null;
}

function nextOpening(
  schedule: Map<string, Array<[number, number]>>,
  local: LocalTime,
): string | null {
  const minutes = local.hour * 60 + local.minute;

  for (let offset = 0; offset < 8; offset += 1) {
    const key = DAY_ORDER[(local.weekday + offset) % 7];
    for (const [start] of schedule.get(key) ?? []) {
      if (offset === 0 && start <= minutes) continue;
      if (offset === 0) return `Opens ${toClock(start)}`;
      if (offset === 1) return `Opens ${toClock(start)} tomorrow`;
      return `Opens ${toClock(start)} ${capitaliseDay(key)}`;
    }
  }

  return null;
}

function toClock(minutes: number): string {
  const total = minutes % 1440;
  const hour = String(Math.floor(total / 60)).padStart(2, "0");
  return `${hour}:${String(total % 60).padStart(2, "0")}`;
}

function capitaliseDay(key: string): string {
  return SHORT_DAYS[key] ?? key;
}
