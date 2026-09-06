import Image from "next/image";

/**
 * The hero.
 *
 * A photograph rather than a texture. Everything I tried behind the text as a
 * pattern either hurt legibility or looked cheap; a real image of a road at
 * night does the atmospheric work and leaves the type alone.
 *
 * The picture is dark on the left and bright on the right, so the headline
 * sits left and a gradient scrim guarantees contrast regardless of how the
 * image crops at different widths.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-ink/70">
      <Image
        src="/images/night-road.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />

      {/* Scrim. Without it the headline depends on where the image crops. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#06090d]/95 via-[#06090d]/75 to-[#06090d]/25"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32 lg:py-40">
        {/*
          Two blocks, not one balanced paragraph. "Take the OddWay" is the name
          and must never break across lines — text-wrap: balance was splitting
          it after "Take", which reads as a typo.

          The size is capped against the viewport as well as the type scale, so
          the nowrap line can never overflow on a narrow screen.
        */}
        <h1
          className="max-w-[16ch] text-hero text-[#f3efe4] normal-case drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
          style={{ fontSize: "min(var(--text-hero), 8.5vw)" }}
        >
          <span className="block">Find the Strange.</span>
          <span className="block whitespace-nowrap">Take the OddWay.</span>
        </h1>

        <p className="mt-6 max-w-[54ch] text-lede text-[#cfc9bb] capitalize drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
          Find cryptids, folklore, haunted places, strange history, roadside
          oddities, museums, and other unusual stops hiding along your route.
        </p>
      </div>
    </section>
  );
}
