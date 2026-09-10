"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Suggestion } from "@/lib/photos";

/**
 * The suggestion box, on the site rather than in the database dashboard.
 *
 * Unhandled first and newest first within that, because the only question
 * being asked here is "has anybody written in since I last looked".
 *
 * Marking one handled rather than deleting it is the default. A suggestion is
 * somebody taking the trouble to tell you something, and a list that empties
 * itself loses the record of what was already fixed.
 */
export function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHandled, setShowHandled] = useState(false);

  async function setHandled(id: string, handled: boolean) {
    setBusy(id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("suggestions")
        .update({ handled })
        .eq("id", id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this permanently? Use it for spam, not for things you have dealt with.")) {
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("suggestions").delete().eq("id", id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  const waiting = suggestions.filter((s) => !s.handled);
  const done = suggestions.filter((s) => s.handled);
  const shown = showHandled ? done : waiting;

  const when = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));

  const KIND_LABELS: Record<string, string> = {
    new_place: "New place",
    correction: "Correction",
    closed: "Reported closed",
    other: "Other",
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setShowHandled(false)}
          className={
            showHandled
              ? "text-[0.9rem] text-ink-soft underline underline-offset-4"
              : "rounded-[3px] bg-route px-4 py-1.5 text-[0.9rem] font-semibold text-paper"
          }
        >
          Waiting ({waiting.length})
        </button>
        <button
          type="button"
          onClick={() => setShowHandled(true)}
          className={
            showHandled
              ? "rounded-[3px] bg-route px-4 py-1.5 text-[0.9rem] font-semibold text-paper"
              : "text-[0.9rem] text-ink-soft underline underline-offset-4"
          }
        >
          Handled ({done.length})
        </button>
      </div>

      {error ? (
        <p role="alert" className="mb-6 border-l-2 border-[#8c2f22] pl-3">
          {error}
        </p>
      ) : null}

      {shown.length === 0 ? (
        <p className="text-ink-soft">
          {showHandled ? "Nothing handled yet." : "Nothing waiting. Everything has been dealt with."}
        </p>
      ) : (
        <ul className="space-y-5">
          {shown.map((suggestion) => (
            <li
              key={suggestion.id}
              className="border border-contour/40 p-5"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="rounded-[3px] border border-contour/60 px-2 py-0.5 text-[0.75rem] font-semibold text-ink-soft">
                  {KIND_LABELS[suggestion.kind] ?? suggestion.kind}
                </span>
                <span className="text-[0.85rem] text-ink-soft">
                  {when(suggestion.createdAt)}
                </span>
                {suggestion.stopSlug ? (
                  <Link
                    href={`/stops/${suggestion.stopSlug}`}
                    className="text-[0.85rem] text-route underline underline-offset-4"
                  >
                    {suggestion.stopSlug}
                  </Link>
                ) : null}
                {suggestion.category ? (
                  <span className="text-[0.85rem] text-ink-soft">
                    {suggestion.category}
                  </span>
                ) : null}
              </div>

              {/*
                whitespace-pre-wrap because people write in paragraphs and a
                suggestion collapsed into one block is harder to act on.
              */}
              <p className="mt-3 max-w-[70ch] whitespace-pre-wrap">
                {suggestion.message}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {suggestion.email ? (
                  <a
                    href={`mailto:${suggestion.email}?subject=${encodeURIComponent("Your OddWay suggestion")}`}
                    className="text-[0.9rem] font-semibold text-route underline underline-offset-4"
                  >
                    Reply to {suggestion.email}
                  </a>
                ) : (
                  <span className="text-[0.9rem] text-ink-soft">
                    No address left, so no reply possible
                  </span>
                )}

                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setHandled(suggestion.id, !suggestion.handled)}
                  className="rounded-[3px] border border-contour/60 px-4 py-1.5 text-[0.9rem] font-semibold transition-colors hover:bg-lichen/30 disabled:opacity-50"
                >
                  {suggestion.handled ? "Put back" : "Mark handled"}
                </button>

                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => remove(suggestion.id)}
                  className="text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-[#8c2f22] disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
