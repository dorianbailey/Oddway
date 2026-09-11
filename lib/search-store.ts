import type { RoutedStop } from "./corridor";
import type { CategorySlug, Route } from "@/types/oddway";

/**
 * The search: what was typed, what came back, and how it is filtered.
 *
 * Separate from the trip store, and deliberately not persisted.
 *
 * The trip is a thing somebody built and expects to find again tomorrow, so it
 * goes to localStorage. A search is a thing somebody is in the middle of. It
 * should survive opening a stop and coming back — which is most of how the
 * site is used, and which it did not, because all of this lived in useState
 * inside TripPlanner and died the moment the homepage unmounted. Somebody
 * planning Pittsburgh to Asheville, opening the third card and hitting back
 * found an empty form.
 *
 * It should not survive a reload. A module-level variable gives exactly that:
 * client-side navigation keeps the module loaded, a refresh throws the whole
 * thing away. localStorage would be wrong here — it would outlive the refresh
 * that is meant to clear it.
 */

interface TripResult {
  query: { origin: string; destination: string };
  route: Route;
  stops: RoutedStop[];
  matchedCount?: number;
  attribution: string;
}

export type SearchStatus = "idle" | "loading" | "done" | "error";

export interface SearchState {
  origin: string;
  destination: string;
  categories: CategorySlug[];
  maxDetourMinutes: number;
  planned: { origin: string; destination: string } | null;
  result: TripResult | null;
  status: SearchStatus;
  error: string | null;
  visibleCount: number;
  /**
   * Which parameters produced `result`.
   *
   * On remount `planned` is restored, and without this the fetching effect
   * would fire again and re-run a search whose answer is already on screen —
   * a spent routing request against a 2,500/day quota, and a flash of
   * "Finding stops" over results that were already correct.
   */
  resultKey: string | null;
}

export const DEFAULT_DETOUR = 30;
export const PAGE_SIZE = 60;

const initial: SearchState = {
  origin: "",
  destination: "",
  categories: [],
  maxDetourMinutes: DEFAULT_DETOUR,
  planned: null,
  result: null,
  status: "idle",
  error: null,
  visibleCount: PAGE_SIZE,
  resultKey: null,
};

/*
  One frozen object, replaced wholesale on every change. getSnapshot must
  return the same reference until something actually changes or
  useSyncExternalStore re-renders forever.
*/
let state: SearchState = initial;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** The parameters that define a search, for comparing against resultKey. */
export function searchKey(
  planned: { origin: string; destination: string } | null,
  categories: CategorySlug[],
  maxDetourMinutes: number,
): string | null {
  if (!planned) return null;
  return [
    planned.origin,
    planned.destination,
    [...categories].sort().join(","),
    maxDetourMinutes,
  ].join("|");
}

export const searchStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): SearchState {
    return state;
  },

  /** The server has no search in progress, so it renders the empty one. */
  getServerSnapshot(): SearchState {
    return initial;
  },

  set(patch: Partial<SearchState>) {
    state = { ...state, ...patch };
    emit();
  },

  /**
   * Start again.
   *
   * Called from the header logo, which is the one navigation that means "take
   * me back to the beginning" rather than "I have finished looking at this".
   */
  clear() {
    state = initial;
    emit();
  },
};
