"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { bucketStore, rememberPendingSave } from "@/lib/bucket-store";
import { cx } from "@/lib/cx";
import type { Stop } from "@/types/oddway";

interface AddToBucketListButtonProps {
  stop: Stop;
  className?: string;
}

/**
 * Put a stop on the bucket list, or ask for an account if there isn't one.
 *
 * Signed out, this used to be a link to /account reading "Sign in to save
 * this" — honest, but it dropped somebody on a sign-in form with no memory of
 * what they had been looking at, and no explanation of why an account was
 * suddenly involved. Most people would not come back.
 *
 * Now it says the same thing in a panel, explains what saving does, and
 * remembers the stop. Sign in and it is saved by the time the page settles.
 *
 * Until the store has finished asking who is signed in it renders as though
 * signed out — briefly wrong for somebody who is, but the alternative is a
 * disabled control on every card, and the flicker lasts one round trip.
 */
export function AddToBucketListButton({
  stop,
  className,
}: AddToBucketListButtonProps) {
  const router = useRouter();
  const ids = useSyncExternalStore(
    bucketStore.subscribe,
    bucketStore.getSnapshot,
    bucketStore.getServerSnapshot,
  );
  const userId = useSyncExternalStore(
    bucketStore.subscribe,
    bucketStore.getUserId,
    bucketStore.getUserIdServerSnapshot,
  );

  const [failed, setFailed] = useState(false);
  const [asking, setAsking] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const saved = ids.has(stop.id);

  // Escape closes it, and focus goes to the panel rather than staying behind.
  useEffect(() => {
    if (!asking) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAsking(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asking]);

  const buttonClass = cx(
    "w-full rounded-[3px] border px-4 py-2.5 font-semibold transition-colors",
    saved
      ? "border-brass bg-brass/20 text-ink hover:bg-brass/30"
      : "border-contour/50 bg-transparent text-ink-soft hover:border-contour hover:bg-lichen/40",
    className,
  );

  return (
    <>
      <button
        type="button"
        aria-pressed={userId ? saved : undefined}
        onClick={async () => {
          if (!userId) {
            /*
              Remember it before anything else. If they sign in, this is what
              gets saved; if they close the panel, sessionStorage drops it when
              the tab does.
            */
            rememberPendingSave(stop.id);
            setAsking(true);
            return;
          }
          setFailed(false);
          const ok = await bucketStore.toggle(stop.id);
          if (!ok) setFailed(true);
        }}
        className={buttonClass}
      >
        {saved ? "Saved for later" : "Save for later"}
        <span className="sr-only"> — {stop.name}</span>
      </button>

      {failed ? (
        <p role="status" className="mt-2 text-[0.85rem] text-route">
          That didn&rsquo;t save. Check your connection and try again.
        </p>
      ) : null}

      {asking ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-gate-title"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 p-4 sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) setAsking(false);
          }}
        >
          <div className="w-full max-w-[26rem] rounded-[4px] border border-contour/45 bg-paper p-6 shadow-xl">
            <h2 id="save-gate-title" className="text-title">
              Keep a bucket list
            </h2>

            <p className="mt-3 text-ink-soft">
              An account lets you save places you mean to get to, on a private
              map only you can see. It is the one thing here that needs one —
              routes, stops and trips all work signed out.
            </p>

            <p className="mt-3 text-[0.95rem] text-ink-soft">
              <strong className="text-ink">{stop.name}</strong> will be saved as
              soon as you are in.
            </p>

            <button
              type="button"
              onClick={() => router.push("/account")}
              className="mt-6 w-full rounded-[3px] bg-route px-5 py-3 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
            >
              Sign in or create an account
            </button>

            <button
              ref={closeRef}
              type="button"
              onClick={() => setAsking(false)}
              className="mt-3 w-full rounded-[3px] px-5 py-2 text-[0.95rem] text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
