import type { MapStop, Stop } from "@/types/oddway";

interface DisplaySetsInput {
  /** Stops returned by a route search, if one has been run. */
  searchResults: Stop[] | null;
  /** The trip the visitor has saved. */
  savedTrip: Stop[];
  /** Daily recommendations, shown before anything else has happened. */
  fallbackStops: Stop[];
  /** Every stop, for the overview map. */
  allStops?: MapStop[];
}

interface DisplaySets {
  /** What the card list shows. */
  listed: Stop[];
  /** What the map plots. */
  mapped: Stop[] | MapStop[];
}

/**
 * Decides what the card list and the map each show.
 *
 * Extracted because getting this wrong is invisible until someone reports it.
 * A single variable once fed both, so adding a stop to a trip replaced the
 * recommendations with just that stop — which read as the others being
 * deleted.
 *
 * They answer different questions and must never share a variable again:
 *
 *   The list is "what could you add" — results, or recommendations. It must
 *   not shrink because the visitor picked one of them.
 *
 *   The map is "what are you looking at" — results, or the trip in progress,
 *   or the whole index.
 */
export function chooseDisplaySets({
  searchResults,
  savedTrip,
  fallbackStops,
  allStops,
}: DisplaySetsInput): DisplaySets {
  if (searchResults) {
    return { listed: searchResults, mapped: searchResults };
  }

  return {
    listed: fallbackStops,
    mapped: savedTrip.length > 0 ? savedTrip : (allStops ?? fallbackStops),
  };
}
