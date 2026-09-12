import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Next sets none of these by default, and neither did this project. They cost
 * nothing, apply to every response, and close the cheap attacks — clickjacking,
 * MIME sniffing, referrer leakage — without touching a line of application
 * code.
 *
 * The content security policy is the exception and is deliberately in
 * report-only mode. A real CSP on this site has to allow Supabase over
 * websockets, MapLibre's workers and blob URLs, Stripe's checkout redirect and
 * the tile server — and a policy that gets one of those wrong breaks the map
 * silently for everybody. Report-only collects the violations without
 * enforcing, so the policy can be tightened against evidence rather than
 * guesswork.
 */
const securityHeaders = [
  /*
    Force HTTPS for two years, including subdomains. Vercel already redirects,
    but a redirect still involves one plaintext request; this stops the browser
    making it at all after the first visit.
  */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  /*
    Nobody should be framing this site. The account page has a sign-in form on
    it, which is exactly what clickjacking is for.
  */
  { key: "X-Frame-Options", value: "DENY" },
  /* Stops a browser deciding an uploaded file is really a script. */
  { key: "X-Content-Type-Options", value: "nosniff" },
  /*
    Send the full URL within the site and only the origin to anybody else. A
    stop page URL is not sensitive; a search someone ran might be.
  */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /*
    Geolocation is used — "use my location" on the trip planner — so it stays
    available to us and nobody else. The rest are switched off because nothing
    here asks for them.
  */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
];

/**
 * The policy, not yet enforced.
 *
 * Written from what the site actually loads: Supabase for data and images,
 * OpenFreeMap for tiles, Stripe for checkout, and blob/worker URLs because
 * MapLibre renders in a worker. 'unsafe-inline' on styles is there because
 * Next injects them; removing it needs nonces and is a separate job.
 *
 * Watch the browser console for violation reports before switching this to
 * Content-Security-Policy proper.
 */
const reportOnlyCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.openfreemap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.openfreemap.org https://api.stripe.com",
  "worker-src 'self' blob:",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /*
    Visitor photographs are served from Supabase storage. Next refuses remote
    images from hosts it has not been told about, which is a sensible default —
    without this the gallery renders nothing and the error only appears in the
    server log.
  */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qnsomzxhnagzjwjhetzu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        // Everything, including API routes and static assets.
        source: "/:path*",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
        ],
      },
    ];
  },
};

export default nextConfig;
