import type { Stop } from "@/types/oddway";

/**
 * The trip: stops the traveller has actually chosen.
 *
 * This is a plain external store rather than React state so that `useTrip` can
 * read it with useSyncExternalStore. That gives a defined server snapshot, no
 * setState-in-effect on hydration, and synchronisation across browser tabs for
 * free.
 */

const STORAGE_KEY = "oddway:trip";

/** Stable empty reference: getSnapshot must not return a new array each call. */
const EMPTY: Stop[] = [];

let stops: Stop[] = EMPTY;
let hydrated = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
  } catch {
    // Private mode or a full quota. The trip just won't survive a reload.
  }
}

/** Read once, lazily, the first time the store is used on the client. */
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Trust only what still looks like a Stop; the shape may have changed
      // since it was written.
      stops = parsed.filter(
        (item): item is Stop =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Stop).id === "string" &&
          typeof (item as Stop).name === "string",
      );
    }
  } catch {
    stops = EMPTY;
  }
}

export const tripStore = {
  subscribe(listener: () => void) {
    hydrate();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): Stop[] {
    hydrate();
    return stops;
  },

  /** Server renders an empty trip; the client corrects it after hydration. */
  getServerSnapshot(): Stop[] {
    return EMPTY;
  },

  has(id: string): boolean {
    return stops.some((stop) => stop.id === id);
  },

  toggle(stop: Stop) {
    stops = tripStore.has(stop.id)
      ? stops.filter((item) => item.id !== stop.id)
      : [...stops, stop];
    persist();
    emit();
  },

  remove(id: string) {
    stops = stops.filter((stop) => stop.id !== id);
    persist();
    emit();
  },

  clear() {
    stops = EMPTY;
    persist();
    emit();
  },
};

/** Cross-tab sync: another tab wrote the trip, so pick up its version. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    hydrated = false;
    hydrate();
    emit();
  });
}
