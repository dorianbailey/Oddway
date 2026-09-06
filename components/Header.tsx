"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getCollapsed,
  getServerCollapsed,
  subscribeToCollapse,
} from "@/lib/scroll-collapse";
import { OddWayLogo } from "./OddWayLogo";
import { cx } from "@/lib/cx";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const isScrolled = useSyncExternalStore(
    subscribeToCollapse,
    getCollapsed,
    getServerCollapsed,
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
        isScrolled ? "bg-pine/75 backdrop-blur-md" : "bg-pine",
      )}
    >
      {/*
        Three columns: navigation, nameplate, action. The logo sits in the
        middle column, which is centred on the page rather than centred in the
        leftover space — so it stays put whatever the nav is doing either side.

        On phones the grid collapses to a single centred column with the nav
        beneath, because three things across 360px leaves room for none of them.
      */}
      <div className={cx(
          "mx-auto grid max-w-6xl grid-cols-1 items-center gap-x-6 px-5 lg:grid-cols-[1fr_auto_1fr] sm:px-8",
          "transition-all duration-300",
          isScrolled ? "gap-y-0 py-1 lg:gap-y-2 lg:py-2" : "gap-y-2 py-2",
        )}>
        {/*
          On a phone the two button groups slide inward and collapse, leaving
          just the nameplate. Everything is reset at `sm`, where there is room
          for all three columns and nothing needs to move.
        */}
        <nav
          aria-label="Main"
          className={cx(
            "order-2 justify-self-center overflow-hidden transition-all duration-300 motion-reduce:transition-none",
            "lg:order-1 lg:max-h-none lg:translate-x-0 lg:justify-self-start lg:opacity-100",
            isScrolled
              ? "max-h-0 translate-x-10 opacity-0 lg:pointer-events-auto pointer-events-none"
              : "max-h-16 translate-x-0 opacity-100",
          )}
        >
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
          <OddWayLogo
            className={cx(
              "transition-all duration-300 motion-reduce:transition-none",
              isScrolled ? "h-11 lg:h-24" : "h-16 sm:h-20 lg:h-24",
            )}
            priority
          />
          <span className="sr-only">OddWay home</span>
        </Link>

        {/*
          Stories sits with the action rather than in the nav group: it is the
          other thing you might come here to do, and the right-hand column was
          otherwise empty next to a single button.
        */}
        <div
          className={cx(
            "order-3 flex items-center gap-2 overflow-hidden transition-all duration-300 motion-reduce:transition-none",
            "justify-self-center lg:max-h-none lg:translate-x-0 lg:gap-3 lg:justify-self-end lg:opacity-100",
            isScrolled
              ? "max-h-0 -translate-x-10 opacity-0 lg:pointer-events-auto pointer-events-none"
              : "max-h-16 translate-x-0 opacity-100",
          )}
        >
          <Link
            href="/trips"
            className="rounded-[3px] border border-route bg-route px-4 py-1.5 text-[0.9rem] font-semibold text-paper capitalize transition-colors hover:bg-[var(--color-route-hover)]"
          >
            Trips
          </Link>

          <Link
            href="/stories"
            className="rounded-[3px] border border-route bg-route px-4 py-1.5 text-[0.9rem] font-semibold text-paper capitalize transition-colors hover:bg-[var(--color-route-hover)]"
          >
            Stories
          </Link>

          <Link
            href="/#plan"
            className="rounded-[3px] border border-route bg-route px-4 py-1.5 text-[0.9rem] font-semibold text-paper capitalize transition-colors hover:bg-[var(--color-route-hover)]"
          >
            Plan a trip
          </Link>
        </div>
      </div>

      <p
        aria-hidden="true"
        className={cx(
          "border-t border-brass/20 px-5 py-1 text-center font-body",
          "text-[0.7rem] tracking-[0.16em] text-lichen/80 uppercase",
          "transition-colors duration-300 sm:px-8 sm:text-[0.78rem]",
          "overflow-hidden lg:max-h-none lg:py-1 lg:opacity-100",
          isScrolled
            ? "max-h-0 py-0 opacity-0 lg:opacity-100 bg-pine-deep/75"
            : "max-h-10 opacity-100 bg-pine-deep",
        )}
      >
        Strange Stops Along Your Route &middot; Price: Free
      </p>
    </header>
  );
}
