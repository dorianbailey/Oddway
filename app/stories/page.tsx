import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Longer pieces on cryptid history, folklore and the places behind them — where the stories started and what is actually there now.",
};

export default function StoriesPage() {
  const articles = getArticles();

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">Stories</h1>
        <p className="mt-6 max-w-[62ch] text-lede text-[#cfc9bb]">
          Where the stories started, who told them first, and what is actually
          at the site now. Written and sourced, not aggregated.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {articles.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            Nothing published yet.
          </p>
        ) : (
          <ul className="divide-y divide-contour/30 border-y border-contour/30">
            {articles.map((article) => (
              <li key={article.slug} className="py-7">
                <p className="font-body text-[0.75rem] tracking-[0.2em] text-ink-soft uppercase">
                  Case Study No. {article.caseNumber}
                </p>
                <h2 className="mt-2 text-title">
                  <Link
                    href={`/stories/${article.slug}`}
                    className="underline-offset-4 hover:text-route hover:underline"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-[68ch] text-ink-soft">
                  {article.summary}
                </p>
                <p className="mt-3 text-[0.9rem] text-ink-soft">
                  <time dateTime={article.date}>
                    {new Date(article.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>{" "}
                  &middot; {article.minutes} min read
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
