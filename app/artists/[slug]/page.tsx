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

  /*
    The first paragraph goes above the hero image.

    A page that opens on a picture makes the reader work out who they are
    looking at from the caption. One paragraph of introduction, then the work.

    The prose arrives as a single blob of HTML from the markdown, so this cuts
    on the first closing paragraph tag — there is no component boundary to use.
    An artist with one paragraph renders exactly as before.
  */
  const parts = artist.html.split("</p>");
  const hasLead = parts.length > 1;
  const lead = hasLead ? parts[0] + "</p>" : "";
  const rest = hasLead ? parts.slice(1).join("</p>") : artist.html;

  const hero = artist.heroImage ?? artist.image;
  const heroCredit = artist.heroImage
    ? artist.heroImageCredit
    : artist.imageCredit;

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
        {hasLead ? (
          <div
            className="article mb-10"
            dangerouslySetInnerHTML={{ __html: lead }}
          />
        ) : null}

        {/*
          The hero when there is one, the list image otherwise. The credit
          follows whichever picture is actually shown — attaching one image's
          credit to another is worse than having none.
        */}
        {hero ? (
          <figure className="mb-10">
            <Image
              src={hero}
              alt=""
              width={1200}
              height={900}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full border border-contour/45"
            />
            {/* Credit is not optional on somebody else's work. */}
            {heroCredit ? (
              <figcaption className="mt-2 text-[0.85rem] text-ink-soft">
                {heroCredit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div
          className="article"
          dangerouslySetInnerHTML={{ __html: rest }}
        />

        {/*
          The second picture sits after the prose and immediately before the
          links — once somebody knows what she makes, and right where they can
          go and buy it.
        */}
        {artist.bodyImage ? (
          <figure className="mt-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.bodyImage}
              alt={`Work by ${artist.name}`}
              loading="lazy"
              className="w-full border border-contour/45"
            />
            {artist.bodyImageCredit ? (
              <figcaption className="mt-2 text-[0.85rem] text-ink-soft">
                {artist.bodyImageCredit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

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
