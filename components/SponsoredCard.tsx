"use client";

import { cx } from "@/lib/cx";
import type { SponsoredPlace } from "./RouteMap";

/** Matches StopCard, so a sponsored card sits in the grid without standing out. */
const TILTS = [
  "rotate-[-0.5deg]",
  "rotate-[0.35deg]",
  "rotate-[-0.25deg]",
  "rotate-[0.55deg]",
] as const;

interface SponsoredCardProps {
  place: SponsoredPlace;
}

/**
 * A paid placement, shown as a card.
 *
 * Its own component rather than a Stop passed through StopCard, because a
 * sponsored place is not a stop and does not have what one has: no slug, no
 * category, no opening hours, no access state, and no page on this site. Faking
 * those fields to reuse the card would put an object into the codebase that is
 * indistinguishable from an index entry — which is the exact confusion the
 * about page promises does not exist.
 *
 * It borrows the clipping styling so the grid stays visually even, and says
 * SPONSORED across the top so nobody has to work out which it is.
 */
export function SponsoredCard({ place }: SponsoredCardProps) {
  const tiltIndex =
    place.id
      .split("")
      .reduce((total, character) => total + character.charCodeAt(0), 0) %
    TILTS.length;

  return (
    <article
      className={cx(
        "clipping hover:clipping-hover flex w-full flex-col rounded-[2px] border border-contour/40 bg-paper-raised",
        TILTS[tiltIndex],
      )}
    >
      <span aria-hidden="true" className="tape" />

      <div className="flex items-center justify-center rounded-t-[2px] border-b border-contour/35 bg-paper px-5 py-3">
        <span className="rounded-full border border-brass/60 bg-brass/15 px-3 py-1 font-body text-[0.68rem] font-bold tracking-[0.2em] text-ink-soft uppercase">
          Sponsored
        </span>
      </div>

      <div className="flex grow flex-col p-5">
        <h3 className="text-center text-title">
          {/*
            Out to their own site, not to a page here — there isn't one. The
            paid-link marker is what it is: Google asks for rel="sponsored" on
            anything bought, and it is the honest answer whether or not anybody
            checks.
          */}
          <a
            href={place.destinationUrl}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            className="underline-offset-4 hover:text-route hover:underline"
          >
            {place.businessName}
          </a>
        </h3>

        {place.locationName ? (
          <p className="mt-1 text-center text-[0.95rem] text-ink-soft">
            {place.locationName}
          </p>
        ) : null}

        {place.description ? (
          <p className="mt-4 text-[0.98rem] text-ink">{place.description}</p>
        ) : null}

        <div className="mt-auto pt-5">
          <a
            href={place.destinationUrl}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            className="block w-full rounded-[3px] border border-contour/50 px-4 py-2.5 text-center font-semibold text-ink-soft transition-colors hover:border-contour hover:bg-lichen/40"
          >
            Visit their site
          </a>
          {/*
            "Nothing in the index is here because somebody paid for it" reads
            correctly under a banner, where the contrast is between the advert
            and the pages around it. On this card it is nonsense: the card is
            here because somebody paid. Saying so plainly is the honest version,
            and the disclaimer still lives on the banner where it is true.
          */}
          <p className="mt-3 text-center text-[0.8rem] text-ink-soft">
            This one is an advertisement, not an entry in the index.
          </p>
        </div>
      </div>
    </article>
  );
}
