"use client";

import { useId } from "react";
import { cx } from "@/lib/cx";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

/**
 * A rating in half stars, zero to five.
 *
 * Built on a range input rather than a row of clickable stars. Stars look
 * better and are worse: half-star targets are a few pixels wide, they are
 * hopeless on a phone, and making them work with a keyboard means
 * reimplementing what a range input already does correctly.
 *
 * So the range is the control, and the stars are a picture of its value.
 */
export function StarRating({ value, onChange }: StarRatingProps) {
  const rating = value ?? 0;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((position) => (
            <Star key={position} fill={Math.max(0, Math.min(1, rating - position + 1))} />
          ))}
        </span>
        <span className={cx("text-[0.95rem]", value === null ? "text-ink-soft" : "font-semibold")}>
          {value === null ? "Not rated" : `${rating} out of 5`}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={5}
        step={0.5}
        value={rating}
        aria-label="Rating out of five"
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full max-w-[18rem] accent-[var(--color-route)]"
      />

      {value !== null ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-2 block text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-route"
        >
          Clear rating
        </button>
      ) : null}
    </div>
  );
}

/** `fill` runs 0 to 1, so a half star is a clip rather than a second icon. */
function Star({ fill }: { fill: number }) {
  /*
    useId rather than a random string. Each star needs a gradient with a unique
    id, but generating one during render produces a different value every time
    the component re-renders, which churns the DOM and breaks on the server
    where the markup must match. useId is stable across both.
  */
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--color-route)" />
          <stop offset={`${fill * 100}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z"
        fill={`url(#${id})`}
        stroke="var(--color-route)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
