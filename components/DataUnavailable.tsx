/**
 * Shown when the index could not be loaded.
 *
 * Distinct from an empty result on purpose. "Nothing matches that" tells
 * someone to change their search; this tells them the fault is ours and their
 * search was probably fine — which is the difference between a visitor
 * adjusting filters for five minutes and a visitor coming back later.
 */
export function DataUnavailable({ what = "the index" }: { what?: string }) {
  return (
    <div
      role="status"
      className="border-l-2 border-route bg-paper-raised py-6 pl-5"
    >
      <p className="text-lede">We couldn&rsquo;t load {what} just now.</p>
      <p className="mt-2 max-w-[58ch] text-ink-soft">
        This is a problem at our end rather than anything you did. Refreshing in
        a minute usually sorts it.
      </p>
    </div>
  );
}
