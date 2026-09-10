import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { getArtist, getArtists } from "@/lib/artists";

export const revalidate = 3600;

interface ArtistPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getArtists().map((artist) => ({ slug: artist.slug }));
}

export async function generateMetadata({
  params,
}: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtist(slug);
  if (!artist) return { title: "Not found" };

  return {
    title: artist.name,
    description: artist.summary,
    openGraph: {
      title: `${artist.name} | OddWay`,
      description: artist.summary,
      images: ["/opengraph-image.jpg"],
    },
  };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params;
  const artist = getArtist(slug);
  if (!artist) notFound();

  return (
    <>
      <PageHero>
        <p className="text-[0.95rem] text-[#cfc9bb]">
          <Link href="/artists" className="underline underline-offset-4">
            Odd artists
          </Link>
        </p>
        <h1 className="mt-4 max-w-[22ch] text-hero">{artist.name}</h1>
        {artist.medium || artist.location ? (
          <p className="mt-4 text-[0.95rem] text-[#cfc9bb]">
            {[artist.medium, artist.location].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </PageHero>

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
        {artist.image ? (
          <figure className="mb-10">
            <Image
              src={artist.image}
              alt=""
              width={1200}
              height={900}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full border border-contour/45"
            />
            {/* Credit is not optional on somebody else's work. */}
            {artist.imageCredit ? (
              <figcaption className="mt-2 text-[0.85rem] text-ink-soft">
                {artist.imageCredit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div
          className="article"
          dangerouslySetInnerHTML={{ __html: artist.html }}
        />

        {artist.links.length > 0 ? (
          <section className="mt-12 border-t border-contour/40 pt-8">
            {/*
              Not everybody sells online. Heading a list of one Instagram
              account "Support Their Work" promises a shop that is not there,
              and sends somebody looking for a buy button that does not exist.
            */}
            <h2 className="text-title">
              {artist.links.some((link) => /shop|store|etsy|buy/i.test(link.label))
                ? "Support Their Work"
                : "Find Their Work"}
            </h2>
            <p className="mt-2 max-w-[52ch] text-ink-soft">
              These go straight to {artist.name}. OddWay takes nothing and has
              no arrangement with anyone listed here.
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {artist.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-[3px] bg-route px-5 py-2.5 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
