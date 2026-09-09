"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { cx } from "@/lib/cx";
import { screenText } from "@/lib/language-filter";
import {
  checkNameShape,
  describeProfileError,
  isNameTaken,
} from "@/lib/display-names";

type Mode = "signin" | "signup" | "forgot";

const MINIMUM_AGE = 13;

/**
 * Age on a given date, or null if the input is not a usable date.
 *
 * Asked as a date of birth rather than a "yes I am over 13" box, because a
 * checkbox is answered without reading and a date has to be thought about. It
 * is still self-declared and anybody can lie — the point is a barrier made in
 * good faith, not enforcement, which no website can do.
 *
 * The date is never sent anywhere. It is checked in the browser and discarded,
 * so the site does not end up holding a database of children's birthdays in
 * order to keep children out.
 */
function ageOn(birthDate: string, today = new Date()): number | null {
  if (!birthDate) return null;
  const born = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  if (born > today) return null;

  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();
  // Not yet had this year's birthday.
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return age;
}

export { ageOn, MINIMUM_AGE };

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      {/* A struck-through eye reads as hidden more clearly than a second icon. */}
      {open ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}

/**
 * Signing in and signing up.
 *
 * One form with two modes rather than two pages, because the fields are almost
 * identical and a person who guesses wrong should not have to navigate.
 */
export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /*
    Checks availability while typing rather than only on submit.

    A name that is set once and can never be changed is the wrong place to
    discover a problem after filling in a whole form. The database still has
    the last word — two people can type the same name at the same moment — but
    almost nobody should ever meet that.
  */
  useEffect(() => {
    if (mode !== "signup") return;
    const trimmed = displayName.trim();

    if (checkNameShape(trimmed).ok === false) {
      const clear = setTimeout(() => setNameStatus("idle"), 0);
      return () => clearTimeout(clear);
    }

    const timer = setTimeout(async () => {
      setNameStatus("checking");
      const taken = await isNameTaken(trimmed);
      setNameStatus(taken ? "taken" : "free");
    }, 400);

    return () => clearTimeout(timer);
  }, [displayName, mode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = getBrowserSupabase();

      if (mode === "forgot") {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/account/reset`,
        });
        /*
          The same message either way, and the error is deliberately ignored.

          Saying "no account with that address" turns this form into a way of
          checking whether somebody has an account here, which is not ours to
          disclose. A person who mistypes their own address gets no email and
          tries again; that is a smaller cost than confirming strangers'
          memberships to anyone who asks.
        */
        setNotice(
          "If there is an account for that address, a reset link is on its way. " +
            "The link works once and expires after an hour.",
        );
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error(error.message);
        router.push("/account");
        router.refresh();
        return;
      }

      if (password !== confirmPassword) {
        throw new Error("Those passwords do not match.");
      }

      const age = ageOn(birthDate);
      if (age === null) {
        throw new Error("Enter your date of birth.");
      }
      if (age < MINIMUM_AGE) {
        throw new Error(
          `Accounts are for people aged ${MINIMUM_AGE} and over. You can still ` +
            `use the whole site without one.`,
        );
      }

      const trimmed = displayName.trim();

      const shape = checkNameShape(trimmed);
      if (!shape.ok) throw new Error(shape.reason);

      /*
        Checked before the account is created, so somebody who picked a taken
        name is not left holding an auth account with no profile — which is
        how you end up signed in, nameless, and unable to do anything.
      */
      if (await isNameTaken(trimmed)) {
        throw new Error("Somebody already has that name. Pick another.");
      }

      /*
        Screened here because a display name is the hardest thing to fix later:
        it is set once, it appears beside every photograph, and changing it
        means an administrator editing the database by hand.
      */
      const screened = screenText(trimmed);
      if (!screened.clean) {
        throw new Error("Pick a different display name.");
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);

      /*
        The profile row is created here rather than by a database trigger,
        because it needs a display name that only exists in this form. If the
        session is not ready yet — which happens when email confirmation is
        switched on — the insert is skipped and the account page creates it
        after the first sign-in.
      */
      if (data.session && data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({ id: data.user.id, display_name: trimmed });
        if (profileError) throw new Error(describeProfileError(profileError.message));

        router.push("/account");
        router.refresh();
        return;
      }

      setNotice(
        "Check your email for a confirmation link, then sign in to finish setting up.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-[3px] border border-contour/60 bg-paper px-3 py-2.5 text-ink " +
    "focus:border-route focus:outline-none";

  return (
    <form onSubmit={submit} className="max-w-[26rem]">
      <div className="mb-8 flex gap-2" role="tablist">
        {(["signin", "signup"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={mode === option || (option === "signin" && mode === "forgot")}
            onClick={() => {
              setMode(option);
              setError(null);
              setNotice(null);
              setConfirmPassword("");
              setBirthDate("");
            }}
            className={cx(
              "rounded-[3px] px-4 py-2 text-[0.95rem] font-semibold transition-colors",
              mode === option
                ? "bg-route text-paper"
                : "border border-contour/60 text-ink-soft hover:bg-lichen/30",
            )}
          >
            {option === "signin" ? "Sign in" : "Create an account"}
          </button>
        ))}
      </div>

      {mode === "signup" ? (
        <label className="mb-5 block">
          <span className="font-semibold">Date of birth</span>
          <span className="mt-1 block text-[0.9rem] text-ink-soft">
            Accounts are for {MINIMUM_AGE} and over. We check it and do not
            store it.
          </span>
          <input
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={field}
          />
        </label>
      ) : null}

      {mode === "signup" ? (
        <label className="block">
          <span className="font-semibold">Display name</span>
          <span className="mt-1 block text-[0.9rem] text-ink-soft">
            Shown next to your photos. This cannot be changed later, so pick
            something you are happy to be credited as.
          </span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={40}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            aria-describedby="name-availability"
            className={field}
          />
          <span
            id="name-availability"
            aria-live="polite"
            className="mt-1 block text-[0.9rem]"
          >
            {nameStatus === "checking" ? (
              <span className="text-ink-soft">Checking…</span>
            ) : nameStatus === "taken" ? (
              <span className="text-[#8c2f22]">
                Somebody already has that name.
              </span>
            ) : nameStatus === "free" ? (
              <span className="text-ink-soft">That one is free.</span>
            ) : null}
          </span>
        </label>
      ) : null}

      {mode === "forgot" ? (
        <p className="mb-5 text-ink-soft">
          Enter the address you signed up with and we will send a link to set a
          new password.
        </p>
      ) : null}

      <label className="mt-5 block">
        <span className="font-semibold">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>

      {mode !== "forgot" ? (
      <label className="mt-5 block">
        <span className="font-semibold">Password</span>
        {/*
          The reveal toggle sits inside the field's box rather than beside the
          label, so it stays next to what it reveals. It is a button rather
          than a checkbox because it performs an action rather than recording a
          preference, and its label says what will happen rather than what the
          icon is.
        */}
        <span className="relative mt-1 block">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cx(field, "mt-0 pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink"
          >
            <EyeIcon open={showPassword} />
          </button>
        </span>
        {mode === "signup" ? (
          <span className="mt-1 block text-[0.9rem] text-ink-soft">
            At least 8 characters.
          </span>
        ) : null}
      </label>
      ) : null}

      {/*
        Confirmation on signup only.

        There is no point asking twice at sign-in: a mistyped password there
        fails immediately and the person simply tries again. At signup a typo
        locks them out of an account they cannot get back into, which is the
        case worth guarding.

        The reveal toggle governs both fields together, because checking one
        against the other is exactly what a person uses it for.
      */}
      {mode === "signup" ? (
        <label className="mt-5 block">
          <span className="font-semibold">Confirm password</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={field}
            aria-describedby="password-match"
          />
          {confirmPassword && password !== confirmPassword ? (
            <span
              id="password-match"
              className="mt-1 block text-[0.9rem] text-[#8c2f22]"
            >
              These do not match yet.
            </span>
          ) : null}
        </label>
      ) : null}

      {mode === "signin" ? (
        <button
          type="button"
          onClick={() => {
            setMode("forgot");
            setError(null);
            setNotice(null);
          }}
          className="mt-4 block text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-route"
        >
          Forgotten your password?
        </button>
      ) : null}

      {mode === "forgot" ? (
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-4 block text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-route"
        >
          Back to signing in
        </button>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-5 border-l-2 border-[#8c2f22] pl-3 text-[0.95rem] text-ink"
        >
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-5 border-l-2 border-route pl-3 text-[0.95rem] text-ink">
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || (mode === "signup" && nameStatus === "taken")}
        className="mt-7 rounded-[3px] bg-route px-6 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-60"
      >
        {busy
          ? "Working…"
          : mode === "signin"
            ? "Sign in"
            : mode === "forgot"
              ? "Send reset link"
              : "Create account"}
      </button>
    </form>
  );
}
