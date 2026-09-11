import { getBrowserSupabase } from "./supabase-browser";

/**
 * The bucket list: stop ids the signed-in person has marked.
 *
 * Shaped like tripStore so the components read the same way, but the backing
 * is different in two ways that matter.
 *
 * It holds ids rather than whole stops. The buttons only ever need to know
 * whether this stop is on the list, and the account page fetches the stops
 * themselves server-side where it can select exactly the columns the map
 * wants. Caching whole rows here would mean a copy that goes stale the moment
 * a stop is renamed.
 *
 * And it is the database, not localStorage. A trip is about this weekend; a
 * bucket list is a thing somebody expects to still have on a new phone in a
 * year. That means it needs an account, and it means every write is a network
 * call that can fail.
 *
 * Writes are optimistic — the button changes immediately and the row is
 * reverted if the server refuses. A button that waits for a round trip before
 * acknowledging a tap feels broken on a slow connection, and the failure here
 * is cheap: the worst case is a star that flicks back.
 */

type Ids = ReadonlySet<string>;

/** Stable empty reference: getSnapshot must not return a new set each call. */
const EMPTY: Ids = new Set<string>();

let ids: Ids = EMPTY;
let userId: string | null = null;
let loaded = false;
let loading = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Who is signed in, and what is on their list.
 *
 * Called once per page load from whichever button mounts first. Signed out,
 * this settles on an empty list and the buttons offer the account page
 * instead.
 */
async function load() {
  if (loaded || loading || typeof window === "undefined") return;
  loading = true;

  try {
    const supabase = getBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      loaded = true;
      return;
    }

    userId = user.id;

    const { data, error } = await supabase
      .from("bucket_list")
      .select("stop_id")
      .eq("user_id", user.id);

    if (!error && data) {
      ids = new Set(data.map((row) => row.stop_id as string));
    }
  } catch {
    // Signed out, offline, or Supabase unreachable. An empty list is the
    // honest answer; the buttons will simply offer to sign in.
  } finally {
    loaded = true;
    loading = false;
    emit();
  }
}

export const bucketStore = {
  subscribe(listener: () => void) {
    void load();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): Ids {
    return ids;
  },

  /** The server renders an empty list; the client corrects it after load. */
  getServerSnapshot(): Ids {
    return EMPTY;
  },

  /** Null until we know, and null for good if nobody is signed in. */
  getUserId(): string | null {
    return userId;
  },

  getUserIdServerSnapshot(): string | null {
    return null;
  },

  isReady(): boolean {
    return loaded;
  },

  has(stopId: string): boolean {
    return ids.has(stopId);
  },

  /**
   * Add or remove, showing the change before the server has agreed to it.
   *
   * Returns false when there is nobody to save it for, so the caller can send
   * the person to sign in rather than pretending it worked.
   */
  async toggle(stopId: string): Promise<boolean> {
    if (!userId) return false;

    const wasOn = ids.has(stopId);
    const next = new Set(ids);
    if (wasOn) next.delete(stopId);
    else next.add(stopId);
    ids = next;
    emit();

    try {
      const supabase = getBrowserSupabase();
      const { error } = wasOn
        ? await supabase
            .from("bucket_list")
            .delete()
            .eq("user_id", userId)
            .eq("stop_id", stopId)
        : await supabase
            .from("bucket_list")
            .insert({ user_id: userId, stop_id: stopId });

      if (error) throw error;
      return true;
    } catch {
      // Put it back. Showing a stop as saved when it is not would be worse
      // than the tap appearing not to take.
      const reverted = new Set(ids);
      if (wasOn) reverted.add(stopId);
      else reverted.delete(stopId);
      ids = reverted;
      emit();
      return false;
    }
  },
};
