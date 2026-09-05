"use client";

import { cx } from "@/lib/cx";
import { UNIT_LABELS, type UnitSystem } from "@/lib/units";
import { useUnits } from "./UnitsProvider";

const OPTIONS: UnitSystem[] = ["imperial", "metric"];

/**
 * Unit switch. Rendered as a labelled radio group rather than a single toggle
 * button, so the current state and the alternative are both readable without
 * having to work out what "Metric" as a button label would do.
 */
export function UnitToggle({ className }: { className?: string }) {
  const { units, setUnits } = useUnits();

  return (
    <fieldset className={className}>
      <legend className="text-[0.9rem] text-lichen">Distances in</legend>
      <div className="mt-2 inline-flex rounded-[3px] border border-brass/40 p-0.5">
        {OPTIONS.map((option) => {
          const isOn = units === option;
          return (
            <label
              key={option}
              className={cx(
                "cursor-pointer rounded-[2px] px-3 py-1.5 text-[0.9rem] transition-colors",
                isOn
                  ? "bg-paper font-semibold text-ink"
                  : "text-lichen hover:text-paper",
              )}
            >
              <input
                type="radio"
                name="units"
                value={option}
                checked={isOn}
                onChange={() => setUnits(option)}
                className="sr-only"
              />
              {UNIT_LABELS[option]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
