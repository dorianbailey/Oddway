import { getBrowserSupabase } from "./supabase-browser";

/**
 * Checking a display name is free before trying to claim it.
 *
 * The database has the last word — a unique index on the lowercased, trimmed
 * name — because two people can reach the signup form at the same moment and
 * a check that happens before an insert cannot prevent that. This exists so
 * that the ordinary case gets a sentence a person can act on instead of a
 * constraint violation.
 *
 * A display name is worth this fuss because it is permanent. It is set once,
 * it cannot be changed afterwards, and every photograph is credited to it. Two
 * accounts sharing one means neither can be told from the other, forever.
 */

export const MIN_LENGTH = 2;
export const MAX_LENGTH = 40;

export interface NameCheck {
  ok: boolean;
  reason?: string;
}

/** Shape and length, without touching the network. */
export function checkNameShape(raw: string): NameCheck {
  const name = raw.trim();

  if (name.length < MIN_LENGTH) {
    return { ok: false, reason: `At least ${MIN_LENGTH} characters, please.` };
  }
  if (name.length > MAX_LENGTH) {
    return { ok: false, reason: `${MAX_LENGTH} characters at most.` };
  }
  /*
    No leading or trailing space is enforced by trimming before storage, but a
    name made only of punctuation is refused outright — it cannot be typed,
    searched for, or told apart from another like it.
  */
  if (!/[a-z0-9]/i.test(name)) {
    return { ok: false, reason: "Names need at least one letter or number." };
  }
  return { ok: true };
}

/** Whether anybody already has it, ignoring case and surrounding space. */
export async function isNameTaken(raw: string): Promise<boolean> {
  const name = raw.trim();
  if (!name) return false;

  try {
    const supabase = getBrowserSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("display_name", name)
      .limit(1);

    return Boolean(data && data.length > 0);
  } catch {
    /*
      If the check cannot run, say the name is free and let the insert decide.
      Refusing a name because a lookup failed would lock somebody out of a name
      nobody has.
    */
    return false;
  }
}

/**
 * Turns a database error into something worth reading.
 *
 * A unique violation arrives as "duplicate key value violates unique
 * constraint profiles_display_name_unique", which tells a visitor nothing.
 */
export function describeProfileError(message: string): string {
  if (/duplicate key|already exists|profiles_display_name_unique/i.test(message)) {
    return "Somebody already has that name. Pick another.";
  }
  return message;
}
