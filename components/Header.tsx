import Link from "next/link";
import { OddWayLogo } from "./OddWayLogo";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header
      data-surface="dark"
      className="sticky top-0 z-50 bg-pine text-paper shadow-[0_3px_0_0_var(--color-ink),0_6px_0_0_var(--color-ink)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 sm:px-8 sm:py-4">
        <Link
          href="/"
          className="shrink-0 rounded-[2px] transition-opacity hover:opacity-80"
        >
          <OddWayLogo />
          <span className="sr-only">OddWay home</span>
        </Link>

        <nav aria-label="Main" className="order-3 w-full sm:order-2 sm:w-auto">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.95rem] text-lichen underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/#plan"
          className="order-2 ml-auto rounded-[3px] bg-route px-4 py-2 text-[0.95rem] font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)] sm:order-3"
        >
          Plan a trip
        </Link>
      </div>

      {/*
        The dateline strip a paper runs under its nameplate. Decorative, so it
        is hidden from assistive technology — a screen reader announcing
        "Vol. I No. 1" before every page would be noise.
      */}
      <p
        aria-hidden="true"
        className="border-t border-brass/20 bg-pine-deep px-5 py-1 text-center font-body text-[0.7rem] tracking-[0.22em] text-lichen/70 uppercase sm:px-8"
      >
        Vol. I &middot; No. 1 &middot; Strange stops along your route &middot;
        Price: free
      </p>
    </header>
  );
}
