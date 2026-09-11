import { bannerUrl, getBanner } from "@/lib/advertisers";

interface BannerAdProps {
  className?: string;
}

/**
 * A paid banner.
 *
 * Renders nothing when nothing is running. An empty frame saying "advertise
 * here" is an advert for us, taking space on a page somebody came to read —
 * and it makes the site look emptier than it is.
 *
 * Three things are deliberate.
 *
 * It says Advertisement, in words, above the image. The FTC asks for
 * disclosure and it matters more here than on most sites: the whole claim of
 * the about page is that nothing in the index is there because somebody paid.
 * A banner that could be mistaken for a listing would put every listing in
 * doubt.
 *
 * It is framed to look like an advert rather than like a stop. Blending in is
 * what makes a disclosure a formality.
 *
 * The link carries rel="sponsored nofollow", which is what a paid link is, and
 * target="_blank" so somebody halfway through planning a route does not lose
 * it by tapping an advert.
 */
export async function BannerAd({ className = "" }: BannerAdProps) {
  const ad = await getBanner();
  const image = bannerUrl(ad?.bannerPath ?? null);
  if (!ad || !image) return null;

  return (
    <aside
      aria-label="Advertisement"
      /*
        Capped, not stretched.

        Left to fill the column a banner rendered at the full 1152px and, for
        anything squarer than about 4:1, took over the page — a paid slot
        shouting down the results it sits beneath. 970 wide is a standard
        leaderboard, which also means advertisers already have artwork at that
        size and nobody has to be asked for something bespoke.
      */
      className={`mx-auto w-full max-w-[970px] rounded-[4px] border border-dashed border-contour/60 bg-paper-sunk p-4 sm:p-5 ${className}`}
    >
      <p className="font-body text-[0.7rem] tracking-[0.16em] text-ink-soft uppercase">
        Advertisement
      </p>

      <a
        href={ad.destinationUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className="mt-3 block overflow-hidden rounded-[3px] border border-contour/35 transition-opacity hover:opacity-90"
      >
        {/*
          A plain img rather than next/image. The dimensions of a banner are
          whatever the advertiser supplied and are not known here, and putting
          an arbitrary third-party host into the image optimiser's allowed
          patterns is a configuration change that outlives the advertiser.

          object-contain rather than cover: a tall image gets letterboxed
          rather than cropped, because cropping somebody's advertisement is a
          worse failure than leaving space beside it.
        */}
        <img
          src={image}
          alt={`${ad.businessName} — advertisement`}
          loading="lazy"
          decoding="async"
          className="mx-auto block max-h-[250px] w-auto max-w-full object-contain"
        />
      </a>

      <p className="mt-3 text-[0.9rem] text-ink-soft">
        <a
          href={ad.destinationUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="font-semibold text-ink underline-offset-4 hover:text-route hover:underline"
        >
          {ad.businessName}
        </a>
        {ad.description ? <> — {ad.description}</> : null}
      </p>

      <p className="mt-3 text-[0.8rem] text-ink-soft">
        A paid advertisement. Nothing in the index is here because somebody paid
        for it.
      </p>
    </aside>
  );
}
