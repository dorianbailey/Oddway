"use client";

import { useEffect } from "react";

/**
 * The root layout itself failed.
 *
 * This is the only error page that has to supply its own html and body tags,
 * because it replaces the layout rather than rendering inside it — which also
 * means no fonts, no stylesheet and no header. Everything here is inline for
 * that reason, and it deliberately stays plain: a page that depends on the
 * thing that just broke is not a fallback.
 *
 * Almost nobody will ever see this. It exists so that the one person who does
 * gets a sentence and a way home, rather than a white screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout failed:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#12171a",
          color: "#f2ede1",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "2.4rem", lineHeight: 1.1, margin: 0 }}>
            OddWay is having a moment
          </h1>
          <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "#cfc9bb" }}>
            Something failed badly enough that the page could not be built at
            all. This is not your doing and it is usually brief.
          </p>
          <p style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                backgroundColor: "#8a6d1f",
                color: "#f2ede1",
                border: "none",
                borderRadius: 3,
                padding: "0.8rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Try again
            </button>
            {/*
              A plain anchor, not next/link, and the rule is disabled on
              purpose. This page renders when the root layout has failed, which
              means the router is among the things that may be broken — asking
              it to handle a navigation is asking the broken thing to fix
              itself. A full page load is the reliable way out.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                color: "#f2ede1",
                padding: "0.8rem 1.5rem",
                border: "1px solid rgba(242,237,225,0.3)",
                borderRadius: 3,
                textDecoration: "none",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Back to the start
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
