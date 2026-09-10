import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nothing here",
  robots: { index: false, follow: true },
};

/**
 * The 404.
 *
 * The whole panel is the link rather than a button underneath it. Somebody who
 * has landed here wanted something specific and did not get it; making them
 * find a small button afterwards is a second small failure. The obvious thing
 * to click should be the obvious thing on the screen.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <Link
        href="/"
        className="group relative block overflow-hidden rounded-[3px] border-2 border-ink/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-route"
      >
        <Image
          src="/images/night-road.webp"
          alt=""
          width={1600}
          height={900}
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="h-[22rem] w-full object-cover object-right transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-[26rem]"
        />

        {/*
          The same scrim the hero uses. Without it the text depends on where
          the image happens to crop.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/20"
        />

        <span className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
          <span className="block max-w-[20ch] font-display text-hero text-paper">
            Like a cryptid, this page cannot be found
          </span>
          <span className="mt-5 block max-w-[46ch] text-lede text-[#cfc9bb]">
            Plenty of other things out there are easier to track down. There are
            over four thousand of them.
          </span>
          <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors group-hover:bg-[var(--color-route-hover)]">
            Back to the start
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h13" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </span>
      </Link>

      <p className="mt-8 max-w-[58ch] text-ink-soft">
        If you followed a link from somewhere on this site and it brought you
        here, that is our mistake rather than yours —{" "}
        <Link
          href="/suggest?kind=correction"
          className="font-semibold text-route underline underline-offset-4"
        >
          tell us where it was
        </Link>{" "}
        and we will fix it.
      </p>
    </div>
  );
}
