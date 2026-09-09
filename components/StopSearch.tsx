"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export interface FoundStop {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
}

interface StopSearchProps {
  value: FoundStop | null;
  onChange: (stop: FoundStop | null) => void;
}

/**
 * Finding the place a photograph belongs to.
 *
 * A photograph must be attached to a stop that already exists, which is why
 * this is a search over the index rather than a free text field. Somebody
 * cannot type a name and have it accepted; they pick a real row or they cannot
 * post.
 *
 * That is the whole point of the requirement: the value of these photographs
 * is that they show a specific place, and a caption saying "the woods near my
 * house" is not that.
 */
export function StopSearch({ value, onChange }: StopSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundStop[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      /*
        Clearing inside a timeout rather than in the effect body.

        Calling setState synchronously while an effect runs makes React render
        again immediately, and a chain of those is what produced the header
        render loop earlier in this project. Deferring it by a tick keeps the
        update out of the render pass.
      */
      const clear = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(clear);
    }

    // Debounced: a query per keystroke would be a request per keystroke.
    const timer = setTimeout(async () => {
      const ticket = ++latest.current;
      setSearching(true);
      try {
        const supabase = getBrowserSupabase();
        const pattern = `%${term.replace(/[%_]/g, "")}%`;
        const { data } = await supabase
          .from("stops")
          .select("id, slug, name, city, state")
          .or(`name.ilike.${pattern},city.ilike.${pattern}`)
          .order("name")
          .limit(8);

        // A slower earlier request must not overwrite a newer answer.
        if (ticket !== latest.current) return;
        setResults((data as FoundStop[]) ?? []);
        setOpen(true);
      } finally {
        if (ticket === latest.current) setSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  if (value) {
    return (
      <div className="mt-1 flex items-start justify-between gap-4 rounded-[3px] border border-route/50 bg-lichen/20 px-3 py-2.5">
        <span>
          <span className="font-semibold">{value.name}</span>
          <span className="block text-[0.9rem] text-ink-soft">
            {value.city}, {value.state}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
            setResults([]);
          }}
          className="shrink-0 text-[0.9rem] font-semibold text-route underline underline-offset-4"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search by name or town"
        aria-label="Search for the place"
        autoComplete="off"
        className="mt-1 w-full rounded-[3px] border border-contour/60 bg-paper px-3 py-2.5 text-ink focus:border-route focus:outline-none"
      />

      {open && results.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-[3px] border border-contour/60 bg-paper shadow-lg">
          {results.map((stop) => (
            <li key={stop.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(stop);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2.5 text-left transition-colors hover:bg-lichen/30"
              >
                <span className="font-semibold">{stop.name}</span>
                <span className="block text-[0.9rem] text-ink-soft">
                  {stop.city}, {stop.state}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {query.trim().length >= 2 && !searching && results.length === 0 ? (
        <p className="mt-2 text-[0.9rem] text-ink-soft">
          Nothing found. Photos have to be attached to a place already in the
          index — if yours is missing, send it through the suggestion box first.
        </p>
      ) : null}
    </div>
  );
}
