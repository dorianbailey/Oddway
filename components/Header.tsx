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
      className="sticky top-0 z-50 border-b border-brass/25 bg-pine text-paper"
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
          className="order-2 ml-auto rounded-[3px] bg-route px-4 py-2 text-[0.95rem] font-semibold text-paper transition-colors hover:bg-[#992f10] sm:order-3"
        >
          Plan a trip
        </Link>
      </div>
    </header>
  );
}
