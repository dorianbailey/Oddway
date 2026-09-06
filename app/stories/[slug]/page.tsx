import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SourceLink } from "@/components/SourceLink";
import { getArticle, getArticles } from "@/lib/articles";
import { getStopBySlug } from "@/lib/stops";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Not found" };

  return {
    title: article.title,
    description: article.summary,
    openGraph: { type: "article", publishedTime: article.date },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  // Stops this piece is about, so a reader can go from the story to the place.
  const related = article.stops
    ? (await Promise.all(article.stops.map((s) => getStopBySlug(s)))).filter(
        (stop) => stop !== null,
      )
    : [];

  return (
    <>
      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-8 sm:pt-14">
        <article className="clipping-head rotate-[-0.3deg] px-6 py-7 sm:px-10 sm:py-9">
          <p className="masthead text-center text-[2.1rem] leading-none sm:text-[3rem]">
            The OddWay News
          </p>

          <div className="masthead-rule mt-3" />

          <p className="mt-4 text-center font-body text-[0.7rem] tracking-[0.18em] text-ink-soft uppercase">
            Case Study No. {article.caseNumber} &middot;{" "}
            <time dateTime={article.date}>
              {new Date(article.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>{" "}
            &middot; {article.minutes} Min Read
          </p>

          <h1 className="mt-5 text-center text-[1.9rem] leading-[1.1] font-bold sm:text-[2.6rem]">
            {article.title}
          </h1>

          <p className="mx-auto mt-4 max-w-[60ch] text-center text-ink-soft">
            {article.summary}
          </p>

          <p className="mt-6 text-center">
            <Link
              href="/stories"
              className="font-body text-[0.85rem] text-route underline underline-offset-4"
            >
              All Case Studies
            </Link>
          </p>
        </article>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-16">
        {article.hero ? (
          <figure className="mb-10">
            <Image
              src={article.hero}
              alt=""
              width={1200}
              height={800}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full border border-contour/45"
            />
            {/* Credit is not optional on a licensed image. */}
            {article.heroCredit ? (
              <figcaption className="mt-2 text-[0.85rem] text-ink-soft">
                {article.heroCredit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div
          className="article"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />

        {related.length > 0 ? (
          <section className="mt-14 border-t border-contour/40 pt-8">
            <h2 className="text-title">Go and see it</h2>
            <ul className="mt-4 space-y-3">
              {related.map((stop) => (
                <li key={stop!.slug}>
                  <Link
                    href={`/stops/${stop!.slug}`}
                    className="font-semibold text-route underline underline-offset-4"
                  >
                    {stop!.name}
                  </Link>
                  <span className="text-ink-soft">
                    {" "}
                    &mdash; {stop!.city}, {stop!.state}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {article.sources && article.sources.length > 0 ? (
          <section className="mt-10 border-t border-contour/40 pt-8">
            <h2 className="text-title">Sources</h2>
            <ul className="mt-4 space-y-2 text-[0.95rem]">
              {article.sources.map((source) => (
                <li key={source} className="break-words">
                  <SourceLink href={source} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
