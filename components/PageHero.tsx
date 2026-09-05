import Image from "next/image";
import type { ReactNode } from "react";

/**
 * The page header used everywhere except the homepage, which has a taller
 * version of the same thing.
 *
 * Shares one photograph across every page deliberately: a different image per
 * section would read as a stock-photo library rather than as one publication.
 * The scrim is heavier here than on the homepage because these headers are
 * shorter, so text sits closer to the bright side of the picture.
 */
export function PageHero({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-ink/70">
      <Image
        src="/images/night-road.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-right"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#06090d]/95 via-[#06090d]/85 to-[#06090d]/45"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-16 text-[#f3efe4] sm:px-8 sm:py-20">
        {children}
      </div>
    </section>
  );
}
