import type { Stop } from "@/types/oddway";
import type { TripOrigin } from "./trip-order";

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
/** Where the trip starts. Needed to order stops and to hand off a full route. */
let origin: TripOrigin | null = null;
/** Where the trip ends. Often home again, hence the location shortcut. */
let destination: TripOrigin | null = null;
let hydrated = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stops, origin, destination }),
    );
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
    const decoded: unknown = JSON.parse(raw);
    // Older versions stored a bare array. Accept both shapes.
    const parsed: unknown = Array.isArray(decoded)
      ? decoded
      : (decoded as { stops?: unknown })?.stops;

    const savedOrigin = Array.isArray(decoded)
      ? null
      : (decoded as { origin?: TripOrigin | null })?.origin ?? null;

    if (isPlace(savedOrigin)) origin = savedOrigin;

    const savedDestination = Array.isArray(decoded)
      ? null
      : (decoded as { destination?: TripOrigin | null })?.destination ?? null;
    if (isPlace(savedDestination)) destination = savedDestination;

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

function isPlace(value: unknown): value is TripOrigin {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TripOrigin).latitude === "number" &&
    typeof (value as TripOrigin).longitude === "number"
  );
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

  getOrigin(): TripOrigin | null {
    hydrate();
    return origin;
  },

  getOriginServerSnapshot(): TripOrigin | null {
    return null;
  },

  setOrigin(next: TripOrigin | null) {
    origin = next;
    persist();
    emit();
  },

  getDestination(): TripOrigin | null {
    hydrate();
    return destination;
  },

  getDestinationServerSnapshot(): TripOrigin | null {
    return null;
  },

  setDestination(next: TripOrigin | null) {
    destination = next;
    persist();
    emit();
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

  /**
   * Replace the whole trip, for loading a curated route.
   *
   * Deliberately a replace rather than an append: somebody choosing a
   * ready-made trip wants that trip, not that trip mixed into whatever they
   * were browsing an hour ago. The origin and destination are cleared for the
   * same reason.
   */
  load(next: Stop[], startAt: TripOrigin | null = null) {
    stops = next;
    origin = startAt;
    destination = null;
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
    origin = null;
    destination = null;
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
