"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { cx } from "@/lib/cx";

type Stage = "checking" | "ready" | "invalid" | "done";

/**
 * Setting a new password after following a reset link.
 *
 * The link carries a one-time code. Supabase exchanges it for a short-lived
 * session, which is the only thing that authorises the change — so this page
 * is useless to anybody who did not receive the email.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function establish() {
      try {
        const supabase = getBrowserSupabase();

        /*
          Two shapes of link exist depending on the project's settings: a
          `code` in the query string, or tokens in the URL fragment which the
          client picks up on its own. Handling the code explicitly covers the
          first; the session check below covers the second.
        */
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!cancelled) setStage(session ? "ready" : "invalid");
      } catch {
        if (!cancelled) setStage("invalid");
      }
    }

    establish();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setStage("done");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-[3px] border border-contour/60 bg-paper px-3 py-2.5 text-ink " +
    "focus:border-route focus:outline-none";

  if (stage === "checking") {
    return <p className="text-lede text-ink-soft">Checking that link…</p>;
  }

  if (stage === "invalid") {
    return (
      <div className="max-w-[52ch]">
        <p className="border-l-2 border-[#8c2f22] pl-4 text-lede text-ink-soft">
          That link has expired or has already been used. Reset links work once
          and last about an hour.
        </p>
        <Link
          href="/account"
          className="mt-8 inline-block font-semibold text-route underline underline-offset-4"
        >
          Ask for a new one
        </Link>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="max-w-[52ch]">
        <p className="border-l-2 border-route pl-4 text-lede text-ink-soft">
          Your password has been changed and you are signed in.
        </p>
        <Link
          href="/account"
          className="mt-8 inline-block rounded-[3px] bg-route px-6 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
        >
          Go to your account
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-[26rem]">
      <label className="block">
        <span className="font-semibold">New password</span>
        <span className="relative mt-1 block">
          <input
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cx(field, "mt-0 pr-11")}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft hover:text-ink"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
              <circle cx="12" cy="12" r="2.6" />
              {show ? <path d="M4 20 20 4" /> : null}
            </svg>
          </button>
        </span>
        <span className="mt-1 block text-[0.9rem] text-ink-soft">
          At least 8 characters.
        </span>
      </label>

      <label className="mt-5 block">
        <span className="font-semibold">Confirm new password</span>
        <input
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={field}
        />
        {confirm && password !== confirm ? (
          <span className="mt-1 block text-[0.9rem] text-[#8c2f22]">
            These do not match yet.
          </span>
        ) : null}
      </label>

      {error ? (
        <p role="alert" className="mt-5 border-l-2 border-[#8c2f22] pl-3 text-[0.95rem]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-7 rounded-[3px] bg-route px-6 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-60"
      >
        {busy ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
