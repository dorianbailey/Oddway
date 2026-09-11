"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/stripe";

interface PlanButtonProps {
  plan: PlanId;
  label: string;
}

/**
 * Starts checkout.
 *
 * Sends the plan name and nothing else. No price, no amount, no Stripe
 * identifier — the server maps a plan to a price against its own environment,
 * because a price the browser supplies is a price the browser can change.
 */
export function PlanButton({ plan, label }: PlanButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Try again.");
        setBusy(false);
        return;
      }
      // Off to Stripe. Deliberately not left enabled behind the redirect —
      // a second tap during the hop would open a second session.
      window.location.href = data.url as string;
    } catch {
      setError("Could not reach the server. Check your connection.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="w-full rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Taking you to Stripe…" : label}
      </button>

      {error ? (
        <p role="status" className="mt-3 text-[0.9rem] text-route">
          {error}
        </p>
      ) : null}
    </>
  );
}
