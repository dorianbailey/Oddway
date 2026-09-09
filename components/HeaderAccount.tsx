"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/**
 * The account button in the masthead.
 *
 * Loads who is signed in from the browser rather than the server, and that is
 * the whole point of it existing.
 *
 * The layout used to do this. Reading cookies in a root layout makes every
 * page in the application dynamic — Next cannot cache a page whose output
 * might depend on who asked — so a single call there quietly took the entire
 * site off the CDN. Every visitor was getting a fresh server render and a
 * database read, and the site went from fast to about three seconds a page.
 *
 * The cost of moving it here is that the avatar appears a beat after the rest
 * of the header. That is a fair trade for every page being cacheable again,
 * and the space it occupies is reserved so nothing shifts when it arrives.
 */
export function HeaderAccount() {
  const [profile, setProfile] = useState<{
    displayName: string | null;
    avatarUrl: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = getBrowserSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_path")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled || !data) return;

        const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
        setProfile({
          displayName: (data.display_name as string) ?? null,
          avatarUrl: data.avatar_path
            ? `${base}/storage/v1/object/public/avatars/${data.avatar_path}`
            : null,
        });
      } catch {
        // Signed out, or Supabase unreachable. The signed-out button is right.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const label = profile?.displayName;

  return (
    <Link
      href="/account"
      aria-label={label ? `Your account, ${label}` : "Sign in"}
      className="shrink-0 rounded-full transition-opacity hover:opacity-80"
    >
      {profile?.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt=""
          width={36}
          height={36}
          unoptimized
          className="h-9 w-9 rounded-full border border-brass/40 object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/40 text-paper"
        >
          {label ? (
            <span className="font-display text-[0.95rem] font-bold">
              {label.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" strokeLinecap="round" />
            </svg>
          )}
        </span>
      )}
    </Link>
  );
}
