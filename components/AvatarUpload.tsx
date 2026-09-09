"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { prepareAvatar, avatarPath, PhotoError } from "@/lib/photo-upload";
import { screenText } from "@/lib/language-filter";

interface AvatarUploadProps {
  userId: string;
  displayName: string;
  currentUrl: string | null;
  currentBio: string | null;
}

export function AvatarUpload({
  userId,
  displayName,
  currentUrl,
  currentBio,
}: AvatarUploadProps) {
  const [bio, setBio] = useState(currentBio ?? "");
  const [savingBio, setSavingBio] = useState(false);
  const [bioNotice, setBioNotice] = useState<string | null>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const blob = await prepareAvatar(file);
      const path = avatarPath(userId);
      const supabase = getBrowserSupabase();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/webp" });
      if (uploadError) throw new Error(uploadError.message);

      const { error: rowError } = await supabase
        .from("profiles")
        .update({ avatar_path: path })
        .eq("id", userId);
      if (rowError) {
        await supabase.storage.from("avatars").remove([path]);
        throw new Error(rowError.message);
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof PhotoError || caught instanceof Error
          ? caught.message
          : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveBio(event: React.FormEvent) {
    event.preventDefault();
    setBioNotice(null);

    const screened = screenText(bio);
    if (!screened.clean) {
      setBioNotice(screened.reason ?? "That cannot be published.");
      return;
    }

    setSavingBio(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("profiles")
        .update({ bio: bio.trim() || null })
        .eq("id", userId);
      if (error) throw new Error(error.message);
      setBioNotice("Saved.");
      router.refresh();
    } catch (caught) {
      setBioNotice(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setSavingBio(false);
    }
  }

  return (
    <>
    <div className="flex items-center gap-5">
      {currentUrl ? (
        <Image
          src={currentUrl}
          alt=""
          width={72}
          height={72}
          unoptimized
          className="h-18 w-18 rounded-full border border-contour/45 object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-contour/45 bg-lichen/30 font-display text-2xl font-bold text-ink-soft"
        >
          {displayName.slice(0, 1).toUpperCase()}
        </span>
      )}

      <div>
        <label className="inline-block cursor-pointer rounded-[3px] border border-contour/60 px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-lichen/30">
          {busy ? "Uploading…" : currentUrl ? "Change picture" : "Add a picture"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
            className="sr-only"
          />
        </label>
        {error ? (
          <p role="alert" className="mt-2 text-[0.9rem] text-[#8c2f22]">
            {error}
          </p>
        ) : null}
      </div>
    </div>

    <form onSubmit={saveBio} className="mt-8 max-w-[30rem]">
      <label className="block">
        <span className="font-semibold">A line about you</span>
        <span className="mt-1 block text-[0.9rem] text-ink-soft">
          Shown on your gallery. 150 characters.
        </span>
        <textarea
          rows={3}
          maxLength={150}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-2 w-full rounded-[3px] border border-contour/60 bg-paper px-3 py-2.5 text-ink focus:border-route focus:outline-none"
        />
      </label>

      <div className="mt-2 flex items-center justify-between gap-4">
        <span className="text-[0.85rem] text-ink-soft">
          {150 - bio.length} left
        </span>
        <button
          type="submit"
          disabled={savingBio}
          className="rounded-[3px] border border-contour/60 px-4 py-2 text-[0.95rem] font-semibold transition-colors hover:bg-lichen/30 disabled:opacity-60"
        >
          {savingBio ? "Saving…" : "Save"}
        </button>
      </div>

      {bioNotice ? (
        <p className="mt-2 text-[0.9rem] text-ink-soft">{bioNotice}</p>
      ) : null}
    </form>
    </>
  );
}
