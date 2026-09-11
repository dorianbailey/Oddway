"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getCollapsed,
  getServerCollapsed,
  subscribeToCollapse,
} from "@/lib/scroll-collapse";
import { HeaderAccount } from "./HeaderAccount";
import { OddWayLogo } from "./OddWayLogo";
import { cx } from "@/lib/cx";
import { searchStore } from "@/lib/search-store";

/**
 * Everything the header can reach.
 *
 * One list, used by both layouts. The wide header splits it into two groups by
 * position and the narrow one puts all of it in a panel — but a link that
 * exists in one and not the other is exactly the sort of drift that leaves a
 * page unreachable on a phone.
 */
const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/trips", label: "Trips" },
  { href: "/stories", label: "Stories" },
  { href: "/artists", label: "Artists" },
  { href: "/photos", label: "Photos" },
  { href: "/about", label: "About" },
] as const;

/** Matches the media query the rest of the site honours. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Header() {
  const isScrolled = useSyncExternalStore(
    subscribeToCollapse,
    getCollapsed,
    getServerCollapsed,
  );

  const pathname = usePathname();
  /*
    The menu is stored against the path it was opened on, so a route change
    closes it by derivation rather than by an effect that calls setState.

    Without closing on navigation, tapping a link leaves the panel sitting open
    over the new page and the tap looks like it did nothing. Doing that in an
    effect is the setState-in-effect pattern that caused the header render loop
    earlier, so it is derived instead.
  */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;
  const setMenuOpen = (open: boolean) => setOpenedOn(open ? pathname : null);

  // Escape closes it, which people expect and which matters more on a phone
  // where there is no obvious outside to tap.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenedOn(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  /*
    The nameplate always takes you to the top of the home page. Clicking a link
    to the page you are already on does nothing in Next, so on the home page
    the logo appeared dead — the one place a masthead is most expected to work.
  */
  function handleLogoClick(event: React.MouseEvent<HTMLAnchorElement>) {
    setMenuOpen(false);
    /*
      The nameplate is the one navigation that means "start again".

      A route search now survives ordinary navigation — opening a stop and
      pressing back used to wipe the form, which is most of how the site is
      used. But that leaves no way to clear it short of reloading the page, and
      the masthead is where people already expect to find the beginning.
    */
    searchStore.clear();
    if (pathname !== "/") return;
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  return (
    <header
      data-surface="dark"
      className={cx(
        "sticky top-0 z-50 text-paper transition-colors duration-300",
        "shadow-[0_3px_0_0_var(--color-ink),0_6px_0_0_var(--color-ink)]",
        isScrolled ? "bg-pine/75 backdrop-blur-md" : "bg-pine",
      )}
    >
      {/*
        One layout at every width: a menu button, the nameplate, and a spacer
        to keep the nameplate centred.

        The wide version used to lay six links and an action across the bar.
        That fit, but it made the header a wall of amber buttons and left the
        nameplate fighting for room. Behind a menu, the masthead is the only
        thing competing for attention, which is what a masthead is for.
      */}
      <div
        className={cx(
          "mx-auto flex max-w-6xl items-center px-5 sm:px-8",
          isScrolled ? "py-1" : "py-2",
        )}
      >
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
          className="-ml-1 shrink-0 rounded-[3px] p-2 text-paper transition-colors hover:bg-white/10"
        >
          <MenuIcon open={menuOpen} />
        </button>

        <Link
          href="/"
          onClick={handleLogoClick}
          className="mx-auto rounded-[2px] transition-opacity hover:opacity-85"
        >
          <OddWayLogo
            className={cx(
              "transition-all duration-300 motion-reduce:transition-none",
              isScrolled ? "h-11 lg:h-14" : "h-16 sm:h-20 lg:h-24",
            )}
            priority
          />
          <span className="sr-only">OddWay home</span>
        </Link>

        {/*
          The account button, balancing the menu button so the nameplate stays
          centred. When nobody is signed in it is still a link — to the sign-in
          page — because an empty space here would be a worse answer to "where
          do I log in" than a quiet icon.
        */}
        <HeaderAccount />
      </div>

      <div
        id="site-menu"
        hidden={!menuOpen}
        className="border-t border-brass/20 bg-pine-deep"
      >
        <nav aria-label="Main" className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-[3px] px-3 py-3 text-[1.05rem] capitalize text-paper transition-colors hover:bg-white/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/#plan"
            className="mt-4 block rounded-[3px] bg-route px-4 py-3 text-center font-semibold text-paper capitalize transition-colors hover:bg-[var(--color-route-hover)]"
          >
            Plan a trip
          </Link>

          {/*
            Below the main list and visually quieter. An account is needed for
            one optional thing; everything else on the site works without it,
            and the menu should say so by its arrangement.
          */}
          <Link
            href="/account"
            className="mt-3 block rounded-[3px] border border-brass/30 px-4 py-3 text-center text-[0.95rem] text-paper capitalize transition-colors hover:bg-white/10"
          >
            Account
          </Link>
        </nav>
      </div>

      <p
        aria-hidden="true"
        className={cx(
          "border-t border-brass/20 px-5 py-1 text-center font-body",
          "text-[0.7rem] tracking-[0.16em] text-lichen/80 uppercase",
          "transition-colors duration-300 sm:px-8 sm:text-[0.78rem]",
          "overflow-hidden",
          isScrolled
            ? "max-h-0 py-0 opacity-0 bg-pine-deep/75"
            : "max-h-10 opacity-100 bg-pine-deep",
        )}
      >
        Strange Stops Along Your Route &middot; Price: Free
      </p>
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}
