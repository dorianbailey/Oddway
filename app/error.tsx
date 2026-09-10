"use client";

import { useEffect } from "react";
import { ErrorPanel } from "@/components/ErrorPanel";

/**
 * Something threw while rendering a page.
 *
 * Different from a missing page, and it gets its own words: the address was
 * fine, we were the problem. Offering a retry rather than a way home is the
 * right first move, because most of these are a moment's trouble reaching the
 * database rather than anything permanent.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs get the detail; the visitor gets a sentence.
    console.error("Page failed to render:", error);
  }, [error]);

  return (
    <ErrorPanel
      headline="Something went wrong on our side"
      body="The page exists — we just could not build it this time. Trying again often works."
      onRetry={reset}
      retryLabel="Try again"
    />
  );
}
