"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { stateName } from "@/lib/us-states";

interface StateFilterProps {
  states: Array<{ code: string; count: number }>;
  /** Currently selected code, or null for all states. */
  selected: string | null;
  /** Total across every state, shown on the "all" option. */
  total: number;
  /** Which listing this filters. Defaults to the stop index. */
  basePath?: string;
  label?: string;
  allLabel?: string;
}

/**
 * Filter the index by state.
 *
 * A native <select> rather than a custom dropdown or a row of chips. It is one
 * tap on a phone, gives a proper wheel picker on iOS, is keyboard and screen
 * reader accessible without any work, and supports type-ahead — pressing "w"
 * jumps to Washington. A bespoke component would have to reimplement all of
 * that, and usually reimplements it worse.
 *
 * Wrapped in a real GET form so it still works with JavaScript disabled; the
 * onChange handler just saves the extra click when JavaScript is available.
 */
export function StateFilter({
  states,
  selected,
  total,
  basePath = "/explore",
  label = "Where are you travelling?",
  allLabel,
}: StateFilterProps) {
  const id = useId();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function go(value: string) {
    setIsNavigating(true);
    router.push(value ? `${basePath}?state=${value}` : basePath);
  }

  return (
    <form
      action={basePath}
      method="get"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("state");
        go(typeof value === "string" ? value : "");
      }}
    >
      <div>
        <label
          htmlFor={id}
          className="block text-[0.9rem] font-semibold text-ink-soft"
        >
          {label}
        </label>
        <select
          id={id}
          name="state"
          defaultValue={selected ?? ""}
          onChange={(event) => go(event.target.value)}
          className="mt-2 min-w-[16rem] rounded-[3px] border border-contour/50 bg-paper px-4 py-2.5 text-ink hover:border-contour"
        >
          <option value="">{allLabel ?? `Anywhere — all ${total} places`}</option>
          {states.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {stateName(entry.code)} ({entry.count})
            </option>
          ))}
        </select>
      </div>

      {/*
        Only useful without JavaScript, where onChange never fires. Hidden from
        everyone else so the control stays a single interaction.
      */}
      <noscript>
        <button
          type="submit"
          className="rounded-[3px] bg-route px-5 py-2.5 font-semibold text-paper"
        >
          Show these
        </button>
      </noscript>

      <p role="status" className="text-[0.9rem] text-ink-soft">
        {isNavigating ? "Loading…" : ""}
      </p>
    </form>
  );
}
