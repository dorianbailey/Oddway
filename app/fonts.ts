import localFont from "next/font/local";

/**
 * Fonts are self-hosted and subset to Latin so the site makes no third-party
 * requests and has no external point of failure at build or run time.
 *
 * Bitter  — slab serif, used for the wordmark, headings and map lettering.
 * Karla   — grotesque, used for body copy, forms and interface labels.
 */

export const bitter = localFont({
  src: [
    {
      path: "./fonts/Bitter-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/Bitter-Italic-Variable.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-bitter",
  display: "swap",
  fallback: ["Georgia", "Cambria", "Times New Roman", "serif"],
});

export const karla = localFont({
  src: [
    {
      path: "./fonts/Karla-Variable.woff2",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-karla",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});
