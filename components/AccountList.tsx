"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { AccountSummary } from "@/lib/photos";

/**
 * Every account, and what each has posted.
 *
 * Blocking from here rather than the dashboard matters because the decision
 * needs context: how long they have been around, how much they have posted and
 * how much of it was rejected. A row in a database table gives none of that,
 * so the judgement gets made on a display name alone.
 */
export function AccountList({ accounts }: { accounts: AccountSummary[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setBlocked(id: string, name: string, blocked: boolean) {
    if (
      blocked &&
      !window.confirm(
        `Block ${name}? Everything they have posted stops being shown and they ` +
          `cannot upload again. Nothing is deleted and this can be undone.`,
      )
    ) {
      return;
    }

    setBusy(id);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("profiles")
        .update({ blocked })
        .eq("id", id);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  if (accounts.length === 0) {
    return <p className="text-ink-soft">No accounts yet.</p>;
  }

  const when = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
      .format(new Date(iso));

  return (
    <>
      {error ? (
        <p role="alert" className="mb-6 border-l-2 border-[#8c2f22] pl-3">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-contour/30 border-y border-contour/30">
        {accounts.map((account) => (
          <li key={account.id} className="flex flex-wrap items-start gap-5 py-5">
            {account.avatarUrl ? (
              <Image
                src={account.avatarUrl}
                alt=""
                width={96}
                height={96}
                unoptimized
                className="h-12 w-12 shrink-0 rounded-full border border-contour/45 object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-contour/45 bg-lichen/30 font-display font-bold text-ink-soft"
              >
                {account.displayName.slice(0, 1).toUpperCase()}
              </span>
            )}

            <div className="min-w-[16rem] flex-1">
              <p className="font-semibold">
                <Link
                  href={`/people/${account.id}`}
                  className="underline-offset-4 hover:text-route hover:underline"
                >
                  {account.displayName}
                </Link>
                {account.isAdmin ? (
                  <span className="ml-2 rounded-[3px] border border-contour/60 px-2 py-0.5 text-[0.75rem] font-semibold text-ink-soft">
                    admin
                  </span>
                ) : null}
                {account.blocked ? (
                  <span className="ml-2 rounded-[3px] bg-[#8c2f22] px-2 py-0.5 text-[0.75rem] font-semibold text-paper">
                    blocked
                  </span>
                ) : null}
              </p>

              <p className="mt-1 text-[0.9rem] text-ink-soft">
                Joined {when(account.createdAt)} &middot; {account.approved} shown
                {account.pending > 0 ? `, ${account.pending} waiting` : ""}
                {account.rejected > 0 ? `, ${account.rejected} hidden` : ""}
              </p>

              {account.bio ? (
                <p className="mt-2 max-w-[52ch] text-[0.9rem]">{account.bio}</p>
              ) : null}
            </div>

            {/*
              An administrator cannot be blocked from here. Locking yourself
              out of the review queue with one mis-click, on the only account
              that can unlock it, is a bad afternoon.
            */}
            {account.isAdmin ? null : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setBlocked(account.id, account.displayName, !account.blocked)}
                className={
                  account.blocked
                    ? "rounded-[3px] border border-contour/60 px-4 py-1.5 text-[0.9rem] font-semibold transition-colors hover:bg-lichen/30 disabled:opacity-50"
                    : "text-[0.9rem] text-ink-soft underline underline-offset-4 hover:text-[#8c2f22] disabled:opacity-50"
                }
              >
                {account.blocked ? "Unblock" : "Block"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
