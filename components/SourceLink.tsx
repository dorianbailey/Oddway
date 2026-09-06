import { cx } from "@/lib/cx";

interface SourceLinkProps {
  /** A URL, or a bare domain like "mysteryhole.com". */
  href: string;
  /** Shown instead of the tidied URL. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * An external link that is actually a link.
 *
 * Sources arrive from three places — OSM website tags, hand research, and
 * imported SQL — and they are inconsistent: some have a scheme, some are bare
 * domains, some have a trailing slash. Rendering them raw produced 164 stop
 * pages where the source was styled text nobody could click.
 *
 * The label is the domain and path with the scheme and any "www." stripped,
 * because a full URL wrapping across three lines is worse than useless.
 */
export function SourceLink({ href, children, className }: SourceLinkProps) {
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;

  let label = href;
  if (!children) {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      label = parsed.host.replace(/^www\./, "") + path;
    } catch {
      label = href;
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "text-route underline underline-offset-4 hover:text-ink",
        "break-words",
        className,
      )}
    >
      {children ?? label}
    </a>
  );
}
