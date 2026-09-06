import localFont from "next/font/local";

/**
 * Fonts are self-hosted and subset to Latin so the site makes no third-party
 * requests and has no external point of failure at build or run time.
 *
 * One serif does everything editorial. Source Serif was drawn for reading on
 * screens: sturdy, plain, and legible at any size. The atmosphere on this site
 * comes from the paper and the dark around it, not from the letterforms — a
 * decorative display face fought the content and made it harder to read.
 *
 * Karla stays for interface chrome: buttons, labels and form fields, where a
 * sans reads as a control rather than as prose.
 */

export const sourceSerif = localFont({
  src: [{ path: "./fonts/SourceSerif4.woff2", weight: "200 900", style: "normal" }],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Cambria", "Times New Roman", "serif"],
});

/**
 * Blackletter, used only for the masthead on story pages. A nameplate is the
 * one place this is legible and appropriate; anywhere else it is unreadable.
 */
export const fraktur = localFont({
  src: [{ path: "./fonts/Unifraktur.woff2", weight: "700", style: "normal" }],
  variable: "--font-fraktur",
  display: "swap",
  fallback: ["Old English Text MT", "Georgia", "serif"],
});

export const karla = localFont({
  src: [{ path: "./fonts/Karla-Variable.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-karla",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});
