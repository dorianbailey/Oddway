"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { OddWayLogo } from "./OddWayLogo";
import { cx } from "@/lib/cx";

/*
  Whether the page has been scrolled at all.

  Read through useSyncExternalStore rather than useState in an effect: that
  gives a defined server snapshot (not scrolled), so the markup matches on
  hydration, and avoids the setState-in-effect pattern lint rejects.
*/
function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const isScrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 8,
    () => false,
  );

  return (
    <header
      data-surface="dark"
      className={cx(
        "sticky top-0 z-50 text-paper transition-colors duration-300",
        "shadow-[0_3px_0_0_var(--color-ink),0_6px_0_0_var(--color-ink)]",
        /*
          Solid at rest, translucent once you start scrolling, so the header
          stops covering what you are reading. 85% keeps text legible over any
          background — paper on it still measures 9:1 even against white.
        */
        isScrolled ? "bg-pine/85 backdrop-blur-md" : "bg-pine",
      )}
    >
      {/*
        Three columns: navigation, nameplate, action. The logo sits in the
        middle column, which is centred on the page rather than centred in the
        leftover space — so it stays put whatever the nav is doing either side.

        On phones the grid collapses to a single centred column with the nav
        beneath, because three things across 360px leaves room for none of them.
      */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-x-6 gap-y-2 px-5 py-2 sm:grid-cols-[1fr_auto_1fr] sm:px-8">
        <nav aria-label="Main" className="order-2 justify-self-center sm:order-1 sm:justify-self-start">
          <ul className="flex items-center gap-2 sm:gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block rounded-[3px] border border-route bg-route px-4 py-1.5 text-[0.9rem] font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/"
          className="order-1 justify-self-center rounded-[2px] transition-opacity hover:opacity-85 sm:order-2"
        >
          <OddWayLogo className="h-14 sm:h-16 lg:h-[72px]" priority />
          <span className="sr-only">OddWay home</span>
        </Link>

        <Link
          href="/#plan"
          className="order-3 justify-self-center rounded-[3px] border border-route bg-route px-4 py-1.5 text-[0.9rem] font-semibold text-paper capitalize transition-colors hover:bg-[var(--color-route-hover)] sm:justify-self-end"
        >
          Plan a trip
        </Link>
      </div>

      <p
        aria-hidden="true"
        className={cx(
          "border-t border-brass/20 px-5 py-1 text-center font-body",
          "text-[0.7rem] tracking-[0.16em] text-lichen/80 uppercase",
          "transition-colors duration-300 sm:px-8 sm:text-[0.78rem]",
          isScrolled ? "bg-pine-deep/85" : "bg-pine-deep",
        )}
      >
        Strange Stops Along Your Route &middot; Price: Free
      </p>
    </header>
  );
}
