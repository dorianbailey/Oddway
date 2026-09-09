"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/**
 * Deleting your own account.
 *
 * Two steps rather than a native confirm dialog. A browser confirm is easy to
 * dismiss by reflex and says nothing about what is about to happen; this makes
 * the consequences visible before the second click, which is the only point at
 * which anything is destroyed.
 */
export function DeleteAccount({ userId }: { userId: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();

      /*
        The image files go first, through the storage API.

        Deleting the account cascades through the database and removes every
        photograph record, but a database cascade cannot reach into object
        storage — the files would stay, unreferenced, with nothing left
        pointing at them and no way to find them again. So they are removed
        while there is still a session that has permission to do it.
      */
      for (const bucket of ["stop-photos", "avatars"]) {
        const { data: folders } = await supabase.storage
          .from(bucket)
          .list(userId);

        for (const entry of folders ?? []) {
          // Photographs sit one level deeper, under the stop's slug.
          const { data: inner } = await supabase.storage
            .from(bucket)
            .list(`${userId}/${entry.name}`);

          const paths = (inner ?? []).length
            ? inner!.map((f) => `${userId}/${entry.name}/${f.name}`)
            : [`${userId}/${entry.name}`];

          await supabase.storage.from(bucket).remove(paths);
        }
      }

      // Then the account itself, which cascades to the profile and its photos.
      const { error: rpcError } = await supabase.rpc("delete_own_account");
      if (rpcError) throw new Error(rpcError.message);

      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `${caught.message} Nothing has been deleted.`
          : "Something went wrong. Nothing has been deleted.",
      );
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="mt-4 block text-[0.95rem] text-ink-soft underline underline-offset-4 hover:text-[#8c2f22]"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="mt-6 max-w-[46ch] border-l-2 border-[#8c2f22] pl-4">
      <p className="font-semibold">Delete your account?</p>
      <p className="mt-2 text-[0.95rem] text-ink-soft">
        This removes your account, your profile, every photo you have posted and
        the image files themselves. It cannot be undone, and your display name
        cannot be claimed again by you or anybody else.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-[0.95rem] text-[#8c2f22]">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="rounded-[3px] bg-[#8c2f22] px-5 py-2.5 font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Deleting…" : "Yes, delete my account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAsking(false);
            setError(null);
          }}
          disabled={busy}
          className="text-[0.95rem] font-semibold underline underline-offset-4 disabled:opacity-60"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
