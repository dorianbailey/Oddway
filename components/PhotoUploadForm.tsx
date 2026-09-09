"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { preparePhoto, storagePath, PhotoError } from "@/lib/photo-upload";
import { StopSearch, type FoundStop } from "./StopSearch";
import { StarRating } from "./StarRating";
import { screenAll } from "@/lib/language-filter";

const BUCKET = "stop-photos";

export function PhotoUploadForm({ authorId }: { authorId: string }) {
  const router = useRouter();
  const [stop, setStop] = useState<FoundStop | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function chooseFile(chosen: File | null) {
    setError(null);
    setFile(chosen);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(chosen ? URL.createObjectURL(chosen) : null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(null);

    // The place is not optional, and saying so here beats a database error.
    if (!stop) {
      setError("Pick the place this photo was taken. Every photo has to be attached to one.");
      return;
    }
    if (!file) {
      setError("Choose a photo to upload.");
      return;
    }

    const screened = screenAll([
      ["Caption", caption],
      ["Description", altText],
    ]);
    if (!screened.clean) {
      setError(screened.reason ?? "That cannot be published.");
      return;
    }

    setBusy(true);
    try {
      // Strips EXIF and resizes before anything leaves the device.
      const prepared = await preparePhoto(file);
      const path = storagePath(authorId, stop.slug);
      const supabase = getBrowserSupabase();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, prepared.blob, { contentType: "image/webp", upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const { error: rowError } = await supabase.from("stop_photos").insert({
        stop_id: stop.id,
        author_id: authorId,
        storage_path: path,
        caption: caption.trim() || null,
        alt_text: altText.trim() || null,
        rating,
      });

      if (rowError) {
        /*
          The row is what makes the file visible. If it fails the upload has to
          come back out, or the bucket accumulates images nothing references
          and nobody can find to delete.
        */
        await supabase.storage.from(BUCKET).remove([path]);
        throw new Error(rowError.message);
      }

      setDone(stop.name);
      setStop(null);
      chooseFile(null);
      setCaption("");
      setAltText("");
      setRating(null);
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

  const field =
    "mt-1 w-full rounded-[3px] border border-contour/60 bg-paper px-3 py-2.5 text-ink " +
    "focus:border-route focus:outline-none";

  return (
    <form onSubmit={submit} className="max-w-[34rem]">
      <label className="block">
        <span className="font-semibold">Where was this?</span>
        <span className="mt-1 block text-[0.9rem] text-ink-soft">
          Required. Photos are attached to a place in the index so they show up
          on its page.
        </span>
      </label>
      <StopSearch value={stop} onChange={setStop} />

      <label className="mt-7 block">
        <span className="font-semibold">Photo</span>
        <span className="mt-1 block text-[0.9rem] text-ink-soft">
          Location and camera data are stripped before it leaves your device.
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-[0.95rem] file:mr-4 file:rounded-[3px] file:border-0 file:bg-route file:px-4 file:py-2 file:font-semibold file:text-paper"
        />
      </label>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mt-4 max-h-64 w-auto border border-contour/45"
        />
      ) : null}

      <label className="mt-7 block">
        <span className="font-semibold">Caption</span>
        <span className="mt-1 block text-[0.9rem] text-ink-soft">Optional.</span>
        <textarea
          maxLength={280}
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={field}
        />
      </label>

      <label className="mt-5 block">
        <span className="font-semibold">Describe the photo</span>
        <span className="mt-1 block text-[0.9rem] text-ink-soft">
          For anyone using a screen reader. Nobody but you knows what is in it.
        </span>
        <input
          type="text"
          maxLength={200}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className={field}
        />
      </label>

      <div className="mt-7">
        <span className="font-semibold">Was it worth the stop?</span>
        <span className="mt-1 mb-3 block text-[0.9rem] text-ink-soft">Optional.</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-[#8c2f22] pl-3 text-[0.95rem]">
          {error}
        </p>
      ) : null}

      {done ? (
        <p className="mt-6 border-l-2 border-route pl-3 text-[0.95rem]">
          Uploaded to {done}. Your first photo is checked before it appears;
          after that they go straight up.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-7 rounded-[3px] bg-route px-6 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Post photo"}
      </button>
    </form>
  );
}
