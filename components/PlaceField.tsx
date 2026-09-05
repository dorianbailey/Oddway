"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";

export interface PlaceSuggestion {
  id?: string;
  label: string;
  context?: string;
  latitude: number;
  longitude: number;
}

interface PlaceFieldProps {
  /** Supply this when the parent needs to focus the field, e.g. on a validation error. */
  id?: string;
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Fired when a suggestion is chosen, so the parent can keep the coordinates. */
  onSelect?: (suggestion: PlaceSuggestion) => void;
  error?: string;
}

/** Long enough to be meaningful, short enough to feel responsive. */
const MIN_QUERY_LENGTH = 3;
/** Waits for a pause in typing. Each request costs provider quota. */
const DEBOUNCE_MS = 300;

/**
 * Place input with type-ahead.
 *
 * Built to the ARIA combobox pattern rather than a div with a click handler:
 * the input owns `aria-expanded` and `aria-activedescendant`, the list is a
 * real listbox, and arrow keys move a virtual cursor without stealing focus
 * from the input. That is what makes it usable with a screen reader and by
 * keyboard alone.
 *
 * Suggestions are an enhancement. If the provider is down, rate limited, or
 * unconfigured, the field stays a plain text input and the form still works.
 */
export function PlaceField({
  id,
  label,
  placeholder,
  value,
  onValueChange,
  onSelect,
  error,
}: PlaceFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-listbox`;
  const errorId = `${inputId}-error`;

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Set when the user picks a suggestion, so we don't immediately re-query
  // for the text we just inserted.
  const justSelected = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const query = value.trim();
  const canSearch = query.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }

    // No setState in the effect body: whether the list shows is derived from
    // the query below, so deleting text hides it without an extra update.
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;

        const data = (await response.json()) as {
          suggestions?: PlaceSuggestion[];
        };
        const next = data.suggestions ?? [];

        setSuggestions(next);
        setIsOpen(next.length > 0);
        setActiveIndex(-1);
      } catch {
        // Aborted or offline. Leave the field working as plain text.
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, canSearch]);

  // Close when focus or a click leaves the field entirely.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function choose(suggestion: PlaceSuggestion) {
    justSelected.current = true;
    onValueChange(suggestion.label);
    onSelect?.(suggestion);
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const count = suggestions.length;
      setActiveIndex((current) => (current + delta + count) % count);
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      // Only swallow Enter when a suggestion is highlighted, so pressing it
      // otherwise still submits the form.
      event.preventDefault();
      choose(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Tab") setIsOpen(false);
  }

  // Derived, so stale suggestions can never show for a query that's too short.
  const showList = isOpen && canSearch && suggestions.length > 0;
  const activeId =
    showList && activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="block text-[0.9rem] font-semibold text-ink-soft">
        {label}
      </label>

      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={onKeyDown}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cx(
          "mt-2 w-full rounded-[3px] border bg-paper px-4 py-3 text-ink placeholder:text-ink-soft/60",
          error ? "border-route" : "border-contour/50 hover:border-contour",
        )}
      />

      {error ? (
        <p id={errorId} className="mt-2 text-[0.9rem] text-route">
          {error}
        </p>
      ) : null}

      <ul
        id={listId}
        role="listbox"
        aria-label={`${label} suggestions`}
        className={cx(
          "absolute z-20 mt-1 w-full overflow-hidden rounded-[3px] border border-contour/50 bg-paper-raised shadow-[0_4px_16px_rgb(43_38_32/0.16)]",
          !showList && "hidden",
        )}
      >
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.id ?? `${suggestion.label}-${index}`}
            id={`${inputId}-option-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            // Mouse down would blur the input before the click registers.
            onPointerDown={(event) => {
              event.preventDefault();
              choose(suggestion);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            className={cx(
              "cursor-pointer px-4 py-2.5",
              index === activeIndex ? "bg-lichen text-ink" : "text-ink",
            )}
          >
            <span className="block">{suggestion.label}</span>
            {suggestion.context ? (
              <span className="block text-[0.85rem] text-ink-soft">
                {suggestion.context}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <p role="status" className="sr-only">
        {showList ? `${suggestions.length} suggestions available.` : ""}
      </p>
    </div>
  );
}
