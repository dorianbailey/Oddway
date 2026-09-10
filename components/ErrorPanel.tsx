import Image from "next/image";
import Link from "next/link";

interface ErrorPanelProps {
  headline: string;
  body: string;
  /** Shown instead of the link when there is something worth retrying. */
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * The panel every error page uses.
 *
 * Written once because there are four ways to end up on an error page — a
 * missing route, a thrown render, a failure in the root layout, and a bad URL
 * that never reaches the router — and the site had a branded page for exactly
 * one of them. The other three showed Next's default, which is a white page
 * with a thin grey line and no way back.
 */
export function ErrorPanel({ headline, body, onRetry, retryLabel }: ErrorPanelProps) {
  const inner = (
    <>
      <Image
        src="/images/night-road.webp"
        alt=""
        width={1600}
        height={900}
        priority
        sizes="(max-width: 1152px) 100vw, 1152px"
        className="h-[22rem] w-full object-cover object-right transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-[26rem]"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/20"
      />

      <span className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
        <span className="block max-w-[20ch] font-display text-hero text-paper">
          {headline}
        </span>
        <span className="mt-5 block max-w-[46ch] text-lede text-[#cfc9bb]">{body}</span>
        <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors group-hover:bg-[var(--color-route-hover)]">
          {retryLabel ?? "Back to the start"}
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
    </>
  );

  const shell =
    "group relative block w-full overflow-hidden rounded-[3px] border-2 border-ink/70 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-route";

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      {onRetry ? (
        <button type="button" onClick={onRetry} className={shell}>
          {inner}
        </button>
      ) : (
        <Link href="/" className={shell}>
          {inner}
        </Link>
      )}

      <p className="mt-8 max-w-[58ch] text-ink-soft">
        If a link on this site brought you here, that is our mistake rather than
        yours —{" "}
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
