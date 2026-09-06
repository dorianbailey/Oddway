import Image from "next/image";
import { cx } from "@/lib/cx";

interface OddWayLogoProps {
  /**
   * Tailwind height classes, e.g. "h-16 sm:h-24". Sizing is done with classes
   * rather than an inline style so responsive variants actually apply — an
   * inline height silently overrides every breakpoint class.
   */
  className?: string;
  priority?: boolean;
}

/**
 * The wordmark. Artwork is 1.29:1 and already transparent, so one file works
 * on the dark masthead and on newsprint.
 *
 * No alt text: it is decorative wherever it appears and the accessible name
 * comes from the visually hidden text beside it, so alt would be read twice.
 */
export function OddWayLogo({ className, priority = false }: OddWayLogoProps) {
  return (
    <Image
      src="/images/oddway-logo.webp"
      alt=""
      width={1200}
      height={931}
      priority={priority}
      sizes="(max-width: 640px) 180px, 320px"
      className={cx("w-auto", className)}
    />
  );
}
