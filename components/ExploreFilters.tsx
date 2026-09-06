"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { stateName } from "@/lib/us-states";

interface ExploreFiltersProps {
  states: Array<{ code: string; count: number }>;
  categoryCounts: Record<string, number>;
  selectedState: string | null;
  selectedCategory: string | null;
  query: string;
  total: number;
  /** How many stops the current filters actually match. */
  matched: number;
}

/**
 * The explore filter bar: free text, category and state.
 *
 * All three live in the URL rather than in client state, so a filtered view is
 * shareable, bookmarkable and indexable, and the whole thing degrades to a
 * plain GET form without JavaScript. The selects submit on change; the text
 * field waits for Enter or the button, because filtering on every keystroke
 * would fire a navigation per letter.
 */
/** Safari ignores text-transform on <option>, so do it in the string. */
function titleCase(value: string): string {
  return value.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function ExploreFilters({
  states,
  categoryCounts,
  selectedState,
  selectedCategory,
  query,
  total,
  matched,
}: ExploreFiltersProps) {
  const id = useId();
  const router = useRouter();
  const [text, setText] = useState(query);

  function go(next: { q?: string; category?: string; state?: string }) {
    const params = new URLSearchParams();
    const q = next.q ?? text;
    const category = next.category ?? selectedCategory ?? "";
    const state = next.state ?? selectedState ?? "";

    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (state) params.set("state", state);

    const search = params.toString();
    router.push(search ? `/explore?${search}` : "/explore");
  }

  const isFiltered = Boolean(query || selectedCategory || selectedState);

  return (
    <form
      action="/explore"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        go({});
      }}
      className="flex flex-wrap items-end gap-x-4 gap-y-4"
    >
      <div className="grow sm:grow-0">
        <label
          htmlFor={`${id}-q`}
          className="block text-[0.9rem] font-semibold text-ink-soft"
        >
          Search
        </label>
        <input
          id={`${id}-q`}
          name="q"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Mothman, asylum, Ohio…"
          className="mt-2 w-full rounded-[3px] border border-contour/50 bg-paper px-4 py-2.5 text-ink placeholder:text-ink-soft/60 hover:border-contour sm:w-64"
        />
      </div>

      <div>
        <label
          htmlFor={`${id}-category`}
          className="block text-[0.9rem] font-semibold text-ink-soft"
        >
          Kind of stop
        </label>
        <select
          id={`${id}-category`}
          name="category"
          value={selectedCategory ?? ""}
          onChange={(event) => go({ category: event.target.value })}
          className="mt-2 min-w-[13rem] rounded-[3px] border border-contour/50 bg-paper px-4 py-2.5 text-ink hover:border-contour"
        >
          <option value="">Everything ({total})</option>
          {CATEGORIES.filter((c) => (categoryCounts[c.slug] ?? 0) > 0).map(
            (category) => (
              <option key={category.slug} value={category.slug}>
                {titleCase(category.label)} ({categoryCounts[category.slug]})
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${id}-state`}
          className="block text-[0.9rem] font-semibold text-ink-soft"
        >
          Where
        </label>
        <select
          id={`${id}-state`}
          name="state"
          value={selectedState ?? ""}
          onChange={(event) => go({ state: event.target.value })}
          className="mt-2 min-w-[13rem] rounded-[3px] border border-contour/50 bg-paper px-4 py-2.5 text-ink hover:border-contour"
        >
          <option value="">Anywhere</option>
          {states.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {titleCase(stateName(entry.code))} ({entry.count})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-[3px] bg-route px-5 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
      >
        Search
      </button>

      {isFiltered ? (
        <button
          type="button"
          onClick={() => {
            setText("");
            router.push("/explore");
          }}
          className="rounded-[2px] py-2.5 text-[0.95rem] text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          Clear
        </button>
      ) : null}

      <p role="status" className="w-full text-[0.95rem] text-ink-soft">
        {isFiltered
          ? `${matched} of ${total} ${total === 1 ? "place" : "places"}`
          : `${total} places`}
      </p>
    </form>
  );
}
