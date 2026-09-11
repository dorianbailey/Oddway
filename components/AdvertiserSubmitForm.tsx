"use client";

import { useState, type FormEvent } from "react";
import { preparePhoto, PhotoError } from "@/lib/photo-upload";

interface Initial {
  businessName: string;
  destinationUrl: string;
  description: string;
  contactName: string;
  locationName: string;
  address: string;
  latitude: string;
  longitude: string;
}

interface AdvertiserSubmitFormProps {
  token: string;
  plan: "banner" | "map";
  initial: Initial;
}

const FIELD =
  "mt-2 w-full rounded-[3px] border border-contour/60 bg-paper px-3 py-2.5 text-ink focus:border-route focus:outline-none";

/**
 * What an advertiser fills in after paying.
 *
 * The banner is processed in the browser before it is sent, by the same code
 * that handles visitor photographs: resized, re-encoded, and stripped of every
 * EXIF tag. An advertiser's logo is less likely to carry a home address than a
 * holiday snap, but a file picked off a phone can carry anything, and there is
 * no reason to accept metadata we will never use.
 *
 * The form posts to a server route rather than uploading to storage directly.
 * It has to: the bucket only accepts writes from an administrator, and the
 * person filling this in has no account at all.
 */
export function AdvertiserSubmitForm({
  token,
  plan,
  initial,
}: AdvertiserSubmitFormProps) {
  const [values, setValues] = useState(initial);
  const [banner, setBanner] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: keyof Initial) => (event: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!banner) {
      setError("Pick a banner image.");
      return;
    }

    setBusy(true);
    try {
      const prepared = await preparePhoto(banner);

      const body = new FormData();
      body.set("token", token);
      body.set("businessName", values.businessName.trim());
      body.set("destinationUrl", values.destinationUrl.trim());
      body.set("description", values.description.trim());
      body.set("contactName", values.contactName.trim());
      if (plan === "map") {
        body.set("locationName", values.locationName.trim());
        body.set("address", values.address.trim());
        body.set("latitude", values.latitude.trim());
        body.set("longitude", values.longitude.trim());
      }
      body.set("banner", prepared.blob, "banner.webp");

      const response = await fetch("/api/advertise/submit", {
        method: "POST",
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "That did not save. Try again.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch (caught) {
      setError(
        caught instanceof PhotoError
          ? caught.message
          : "That did not save. Check your connection and try again.",
      );
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="article max-w-[58ch]">
        <h2 className="text-section">That is with us</h2>
        <p className="text-lede">
          We will look at it, usually the same day, and email you when it is
          live. Nothing appears on the site before then.
        </p>
        <p>
          If you need to change something, reply to the email we sent you. This
          link will not open again — it works once, which is what stops anybody
          who gets hold of it editing your advertisement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-[34rem]">
      <label className="block">
        <span className="font-semibold">Business name</span>
        <input
          type="text"
          required
          maxLength={80}
          value={values.businessName}
          onChange={set("businessName")}
          className={FIELD}
        />
      </label>

      <label className="mt-6 block">
        <span className="font-semibold">Where the advert links to</span>
        <input
          type="url"
          required
          placeholder="https://your-website.com"
          value={values.destinationUrl}
          onChange={set("destinationUrl")}
          className={FIELD}
        />
        <span className="mt-2 block text-[0.9rem] text-ink-soft">
          Paste the full web address, including the part before the dots.
        </span>
      </label>

      <label className="mt-6 block">
        <span className="font-semibold">A line about you</span>
        <textarea
          rows={3}
          maxLength={300}
          value={values.description}
          onChange={set("description")}
          className={FIELD}
        />
        <span className="mt-2 block text-[0.9rem] text-ink-soft">
          Optional, and shown beside the banner. A sentence does it.
        </span>
      </label>

      <label className="mt-6 block">
        <span className="font-semibold">Your name</span>
        <input
          type="text"
          maxLength={80}
          value={values.contactName}
          onChange={set("contactName")}
          className={FIELD}
        />
        <span className="mt-2 block text-[0.9rem] text-ink-soft">
          So we know who we are writing to. Not shown on the site.
        </span>
      </label>

      {plan === "map" ? (
        <fieldset className="mt-10 border-t border-contour/40 pt-8">
          <legend className="text-title">Your place on the map</legend>
          <p className="mt-2 max-w-[46ch] text-ink-soft">
            Where the marker goes. If you do not have coordinates, the address
            is enough and we will find them.
          </p>

          <label className="mt-6 block">
            <span className="font-semibold">Location name</span>
            <input
              type="text"
              maxLength={120}
              value={values.locationName}
              onChange={set("locationName")}
              className={FIELD}
            />
          </label>

          <label className="mt-6 block">
            <span className="font-semibold">Address</span>
            <input
              type="text"
              maxLength={200}
              value={values.address}
              onChange={set("address")}
              className={FIELD}
            />
          </label>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="font-semibold">Latitude</span>
              <input
                type="text"
                inputMode="decimal"
                value={values.latitude}
                onChange={set("latitude")}
                className={FIELD}
              />
            </label>
            <label className="block">
              <span className="font-semibold">Longitude</span>
              <input
                type="text"
                inputMode="decimal"
                value={values.longitude}
                onChange={set("longitude")}
                className={FIELD}
              />
            </label>
          </div>
        </fieldset>
      ) : null}

      <div className="mt-10 border-t border-contour/40 pt-8">
        <label className="block">
          <span className="font-semibold">Your banner</span>
          <input
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setBanner(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-[0.95rem]"
          />
          <span className="mt-2 block text-[0.9rem] text-ink-soft">
            Wide rather than tall — roughly 3:1 looks best. It is resized in
            your browser before it is sent, so a large file is fine.
          </span>
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-route pl-4 text-[0.95rem]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-8 rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send it in"}
      </button>

      <p className="mt-4 text-[0.9rem] text-ink-soft">
        Nothing goes on the site until a person has looked at it.
      </p>
    </form>
  );
}
