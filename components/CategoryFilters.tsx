"use client";

import { useId, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { CategorySlug } from "@/types/oddway";

interface CategoryFiltersProps {
  className?: string;
  /**
   * Called whenever the selection changes. Left optional so the homepage can
   * render this from a server component today; once the results list is real,
   * pass a handler and lift the selection into the trip state.
   */
  onChange?: (selected: CategorySlug[]) => void;
}

export function CategoryFilters({ className, onChange }: CategoryFiltersProps) {
  const headingId = useId();
  const [selected, setSelected] = useState<CategorySlug[]>([]);

  function toggle(slug: CategorySlug) {
    // Derive the next value here rather than inside a setState updater.
    // Updaters must be pure — React can call them during render, and notifying
    // a parent from in there updates another component mid-render.
    const next = selected.includes(slug)
      ? selected.filter((item) => item !== slug)
      : [...selected, slug];

    setSelected(next);
    onChange?.(next);
  }

  function clear() {
    setSelected([]);
    onChange?.([]);
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id={headingId} className="text-title">
          Pick what you want to find
        </h2>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="rounded-[2px] text-[0.95rem] text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/*
        `role="group"` sits on the wrapper rather than the <ul> so the list
        keeps its own semantics and the <li> elements keep a valid parent.
      */}
      <div role="group" aria-labelledby={headingId} className="mt-5">
        <ul className="flex flex-wrap gap-2.5">
          {CATEGORIES.map((category) => {
            const isOn = selected.includes(category.slug);
            return (
              <li key={category.slug}>
                <button
                  type="button"
                  aria-pressed={isOn}
                  onClick={() => toggle(category.slug)}
                  className={cx(
                    "rounded-full border px-4 py-2 text-[0.95rem] transition-colors",
                    isOn
                      ? "border-pine bg-pine font-semibold text-paper"
                      : "border-contour/50 bg-paper-raised text-ink hover:border-contour hover:bg-lichen/40",
                  )}
                >
                  {category.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p role="status" className="mt-4 text-[0.95rem] text-ink-soft">
        {selected.length === 0
          ? "Searching all seven categories."
          : `Searching ${selected.length} of seven categories.`}
      </p>
    </div>
  );
}
