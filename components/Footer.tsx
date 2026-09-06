import Link from "next/link";
import { OddWayLogo } from "./OddWayLogo";
import { UnitToggle } from "./UnitToggle";

const FOOTER_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/suggest", label: "Suggest a stop" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer
      data-surface="dark"
      className="bg-pine/85 text-paper backdrop-blur-[1px]"
    >


      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <OddWayLogo className="h-28" />
          <p className="mt-4 max-w-[34ch] text-lichen">
            <span>Find the Strange.</span>{" "}
            <span className="whitespace-nowrap">Take the OddWay.</span>
          </p>
          <UnitToggle className="mt-8" />
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-12 gap-y-3 sm:grid-cols-4 md:grid-cols-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-lichen underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-brass/20">
        <p className="mx-auto max-w-6xl px-5 py-5 text-[0.9rem] text-lichen/80 sm:px-8">
          © {new Date().getFullYear()} OddWay
        </p>
      </div>
    </footer>
  );
}
