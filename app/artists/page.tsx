import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getArtists, getFeaturedArtist } from "@/lib/artists";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Odd artists",
  description:
    "Artists working on cryptids, folklore and roadside strangeness. A different one featured every week, with links to their shops.",
};

export default function ArtistsPage() {
  const artists = getArtists();
  const featured = getFeaturedArtist();

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">Odd Artists</h1>
        <p className="mt-6 max-w-[62ch] text-lede text-[#cfc9bb]">
          People making work about cryptids, folklore and the strange things
          beside the road. A different one featured every week. Every link goes
          straight to them.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {artists.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            No artists featured yet.
          </p>
        ) : (
          <>
            {featured ? (
              <section className="mb-16 border-b border-contour/40 pb-14">
                <p className="font-body text-[0.75rem] tracking-[0.2em] text-ink-soft uppercase">
                  This week
                </p>

                <div className="mt-6 grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-start">
                  {featured.image ? (
                    <figure>
                      <Image
                        src={featured.image}
                        alt=""
                        width={800}
                        height={800}
                        priority
                        sizes="(max-width: 768px) 100vw, 380px"
                        className="h-auto w-full border border-contour/45"
                      />
                      {featured.imageCredit ? (
                        <figcaption className="mt-2 text-[0.85rem] text-ink-soft">
                          {featured.imageCredit}
                        </figcaption>
                      ) : null}
                    </figure>
                  ) : null}

                  <div>
                    <h2 className="text-section">
                      <Link
                        href={`/artists/${featured.slug}`}
                        className="underline-offset-4 hover:text-route hover:underline"
                      >
                        {featured.name}
                      </Link>
                    </h2>
                    {featured.medium || featured.location ? (
                      <p className="mt-2 text-[0.95rem] text-ink-soft">
                        {[featured.medium, featured.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-4 max-w-[52ch] text-lede text-ink-soft">
                      {featured.summary}
                    </p>

                    <ul className="mt-6 flex flex-wrap gap-3">
                      {featured.links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block rounded-[3px] bg-route px-4 py-2 text-[0.9rem] font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ) : null}

            <h2 className="text-section">Everyone</h2>
            <ul className="mt-8 divide-y divide-contour/30 border-y border-contour/30">
              {artists.map((artist) => (
                <li key={artist.slug} className="py-6">
                  <h3 className="text-title">
                    <Link
                      href={`/artists/${artist.slug}`}
                      className="underline-offset-4 hover:text-route hover:underline"
                    >
                      {artist.name}
                    </Link>
                  </h3>
                  <p className="mt-1 max-w-[68ch] text-ink-soft">
                    {artist.summary}
                  </p>
                  {artist.medium || artist.location ? (
                    <p className="mt-2 text-[0.9rem] text-ink-soft">
                      {[artist.medium, artist.location].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-12 max-w-[58ch] text-ink-soft">
          Make work like this, or know somebody who does?{" "}
          <Link
            href="/suggest?kind=other"
            className="font-semibold text-route underline underline-offset-4"
          >
            Tell us
          </Link>
          . We only feature people who have said yes.
        </p>
      </div>
    </>
  );
}
