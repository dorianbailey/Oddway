"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { PhotoUploadForm } from "./PhotoUploadForm";
import { AvatarUpload } from "./AvatarUpload";
import { screenText } from "@/lib/language-filter";
import {
  checkNameShape,
  describeProfileError,
  isNameTaken,
  NAME_TAKEN,
} from "@/lib/display-names";
import { DeleteAccount } from "./DeleteAccount";

interface AccountPanelProps {
  userId: string;
  isAdmin: boolean;
  avatarUrl: string | null;
  email: string;
  displayName: string | null;
  blocked: boolean;
  bio: string | null;
}

/**
 * What a signed-in person sees.
 *
 * Also handles the case where an account exists but its profile does not,
 * which happens when email confirmation is on: the account is created before
 * the session, so the display name could not be saved at signup.
 */
export function AccountPanel({ userId, isAdmin, avatarUrl, bio, email, displayName, blocked }: AccountPanelProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "free" | "taken">("idle");

  /*
    The same live check the signup form does.

    This form appears when an account exists but has no name — which happens
    whenever email confirmation is on, since the account is made before the
    session. Somebody arriving here has already been through signup once, and
    finding out their name is taken only after pressing the button would be a
    second disappointment for the same reason.
  */
  useEffect(() => {
    const trimmed = name.trim();
    if (!checkNameShape(trimmed).ok) {
      const clear = setTimeout(() => setNameStatus("idle"), 0);
      return () => clearTimeout(clear);
    }
    const timer = setTimeout(async () => {
      setNameStatus("checking");
      setNameStatus((await isNameTaken(trimmed)) ? "taken" : "free");
    }, 400);
    return () => clearTimeout(timer);
  }, [name]);

  async function signOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function claimName(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const trimmed = name.trim();

      const shape = checkNameShape(trimmed);
      if (!shape.ok) throw new Error(shape.reason);

      const screened = screenText(trimmed);
      if (!screened.clean) throw new Error("Pick a different display name.");

      if (await isNameTaken(trimmed)) {
        throw new Error(NAME_TAKEN);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not signed in.");

      const { error } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: trimmed });
      if (error) throw new Error(describeProfileError(error.message));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (blocked) {
    return (
      <div className="max-w-[52ch]">
        <p className="border-l-2 border-[#8c2f22] pl-4 text-lede text-ink-soft">
          This account cannot post photos. If you think that is a mistake, get in
          touch through the suggestion box.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-8 text-[0.95rem] font-semibold text-route underline underline-offset-4"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!displayName) {
    return (
      <form onSubmit={claimName} className="max-w-[26rem]">
        <p className="text-lede text-ink-soft">
          One more thing: pick the name your photos will be credited to. It
          cannot be changed afterwards.
        </p>
        <input
          type="text"
          required
          minLength={2}
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-describedby="claim-availability"
          className="mt-5 w-full rounded-[3px] border border-contour/60 bg-paper px-3 py-2.5 text-ink focus:border-route focus:outline-none"
        />
        <span id="claim-availability" aria-live="polite" className="mt-1 block text-[0.9rem]">
          {nameStatus === "checking" ? (
            <span className="text-ink-soft">Checking…</span>
          ) : nameStatus === "taken" ? (
            <span className="text-[#8c2f22]">{NAME_TAKEN}</span>
          ) : nameStatus === "free" ? (
            <span className="text-ink-soft">That one is free.</span>
          ) : null}
        </span>
        {error ? (
          <p role="alert" className="mt-4 border-l-2 border-[#8c2f22] pl-3 text-[0.95rem]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || nameStatus === "taken"}
          className="mt-6 rounded-[3px] bg-route px-6 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save name"}
        </button>
      </form>
    );
  }

  return (
    <div className="max-w-[40rem]">
      <div className="mb-10">
        <AvatarUpload
          userId={userId}
          displayName={displayName}
          currentUrl={avatarUrl}
          currentBio={bio}
        />
      </div>

      <dl className="divide-y divide-contour/30 border-y border-contour/30">
        <div className="flex justify-between gap-6 py-4">
          <dt className="text-ink-soft">Display name</dt>
          <dd className="font-semibold">{displayName}</dd>
        </div>
        <div className="flex justify-between gap-6 py-4">
          <dt className="text-ink-soft">Email</dt>
          <dd>{email}</dd>
        </div>
      </dl>

      <section className="mt-12 border-t border-contour/40 pt-10">
        <h2 className="text-section">Add A Photo</h2>
        <p className="mt-3 mb-8 max-w-[52ch] text-ink-soft">
          Your first photo is checked before it appears. After that they go up
          straight away.
        </p>
        <PhotoUploadForm authorId={userId} />
      </section>

      <p className="mt-8">
        <a
          href={`/people/${userId}`}
          className="font-semibold text-route underline underline-offset-4"
        >
          Your public gallery
        </a>
      </p>

      {isAdmin ? (
        <p className="mt-8">
          <a
            href="/account/review"
            className="font-semibold text-route underline underline-offset-4"
          >
            Review pending photos
          </a>
        </p>
      ) : null}

      <button
        type="button"
        onClick={signOut}
        className="mt-8 block text-[0.95rem] font-semibold text-route underline underline-offset-4"
      >
        Sign out
      </button>

      {/*
        Below sign out and visually quieter than everything above it. Somebody
        looking for it will find it; nobody reaches for it by accident on the
        way to signing out.
      */}
      <DeleteAccount userId={userId} />
    </div>
  );
}
