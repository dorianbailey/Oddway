"use client";

import { useId, useState } from "react";
import { cx } from "@/lib/cx";

interface SuggestionFormProps {
  /** Pre-selects the kind, e.g. a correction link on a stop page. */
  defaultKind?: "correction" | "new_place" | "new_event" | "other";
  /** Which stop this is about, when it came from that stop's page. */
  stopSlug?: string;
  /** Name of the stop, so the form can say what it is about. */
  stopName?: string;
  /** Category slug, when the suggestion came from a category heading. */
  category?: string;
  /** Human label for that category, e.g. "Cryptids". */
  categoryLabel?: string;
  className?: string;
}

const KINDS = [
  ["correction", "Something here is wrong"],
  ["new_place", "A place you should add"],
  ["new_event", "An event you should add"],
  ["other", "Something else"],
] as const;

export function SuggestionForm({
  defaultKind = "other",
  stopSlug,
  stopName,
  category,
  categoryLabel,
  className,
}: SuggestionFormProps) {
  const id = useId();
  const [kind, setKind] = useState<string>(defaultKind);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          email,
          stopSlug,
          category,
          website: honeypot,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Couldn't send that. Try again.");
        setStatus("error");
        return;
      }

      setStatus("sent");
      setMessage("");
      setEmail("");
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className={cx(
          "rounded-[4px] border border-contour/45 bg-paper-raised p-6",
          className,
        )}
      >
        <p className="text-title font-display font-bold">Thank you</p>
        <p className="mt-2 text-ink-soft">
          It goes to a person, not a queue. Corrections about places that have
          closed or moved are the most useful thing anyone sends.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-[2px] text-[0.95rem] text-route underline underline-offset-4"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cx(
        "rounded-[4px] border border-contour/45 bg-paper-raised p-5 sm:p-6",
        className,
      )}
    >
      {stopName ? (
        <p className="text-[0.95rem] text-ink-soft">
          About <span className="font-semibold text-ink">{stopName}</span>
        </p>
      ) : categoryLabel ? (
        <p className="text-[0.95rem] text-ink-soft">
          Adding to{" "}
          <span className="font-semibold text-ink">{categoryLabel}</span>
        </p>
      ) : null}

      <fieldset className="mt-4">
        <legend className="text-[0.9rem] font-semibold text-ink-soft">
          What is this about?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {KINDS.map(([value, label]) => (
            <label
              key={value}
              className={cx(
                "cursor-pointer rounded-full border px-4 py-2 text-[0.95rem] transition-colors",
                kind === value
                  ? "border-pine bg-pine font-semibold text-paper"
                  : "border-contour/50 bg-paper hover:border-contour hover:bg-lichen/40",
              )}
            >
              <input
                type="radio"
                name={`${id}-kind`}
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor={`${id}-message`} className="block text-[0.9rem] font-semibold text-ink-soft">
          What should we know?
        </label>
        <textarea
          id={`${id}-message`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          placeholder="The museum moved to a new building in 2024, and the hours on the door say Thursday to Sunday."
          className="mt-2 w-full rounded-[3px] border border-contour/50 bg-paper px-4 py-3 text-ink placeholder:text-ink-soft/60 hover:border-contour"
        />
      </div>

      <div className="mt-4">
        <label htmlFor={`${id}-email`} className="block text-[0.9rem] font-semibold text-ink-soft">
          Email <span className="font-normal">(optional)</span>
        </label>
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 w-full rounded-[3px] border border-contour/50 bg-paper px-4 py-2.5 text-ink placeholder:text-ink-soft/60 hover:border-contour sm:max-w-sm"
        />
        <p className="mt-2 text-[0.85rem] text-ink-soft">
          Only used if we need to ask you something. No list, no newsletter.
        </p>
      </div>

      {/*
        Honeypot. Hidden from people and from screen readers, but present in
        the DOM, so a bot that fills every field identifies itself.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors hover:bg-[#8a2411] disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send it"}
        </button>

        <p role="status" className="text-[0.95rem] text-route empty:hidden">
          {error}
        </p>
      </div>
    </form>
  );
}
