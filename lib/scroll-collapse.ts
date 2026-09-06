/**
 * Whether the page has been scrolled far enough to collapse the header.
 *
 * This looks like it should be three lines of useState, and the naive version
 * loops forever. Collapsing the header makes it shorter, which reflows the
 * page, which can move the scroll position back across the threshold, which
 * expands the header, which reflows again. React gives up with "maximum update
 * depth exceeded".
 *
 * Two things prevent it:
 *
 *  - The thresholds are asymmetric. It collapses at 72px and only expands back
 *    at the very top, so there is no boundary for the layout shift to bounce
 *    across.
 *  - State lives here, outside React, and changes only inside the scroll
 *    handler. `getSnapshot` is a pure read, which is what
 *    useSyncExternalStore requires — computing or mutating in there is its own
 *    route to an infinite loop.
 */

const COLLAPSE_AT = 72;
/** Not zero: momentum scrolling and rubber-banding rarely land exactly on it. */
const EXPAND_AT = 4;

let collapsed = false;
const listeners = new Set<() => void>();

function handleScroll() {
  const y = window.scrollY;
  const next = collapsed ? y > EXPAND_AT : y > COLLAPSE_AT;
  if (next === collapsed) return;

  collapsed = next;
  for (const listener of listeners) listener();
}

export function subscribeToCollapse(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener("scroll", handleScroll);
    }
  };
}

/** Pure read. Never computes, never mutates. */
export function getCollapsed() {
  return collapsed;
}

/** The server always renders the expanded header, so hydration matches. */
export function getServerCollapsed() {
  return false;
}
