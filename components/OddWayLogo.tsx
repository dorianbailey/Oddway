import { cx } from "@/lib/cx";

interface OddWayLogoProps {
  className?: string;
  /** Type size of the wordmark. */
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "text-[1.0625rem]",
  md: "text-[1.375rem]",
  lg: "text-[1.75rem]",
} as const;

/**
 * Typography-only wordmark. The two rules beneath it are a neatline — the
 * paired border printed around a map sheet — which is the whole mark for now.
 * It inherits `currentColor`, so it works on paper and on pine unchanged.
 */
export function OddWayLogo({ className, size = "md" }: OddWayLogoProps) {
  return (
    <span className={cx("inline-flex flex-col items-stretch", className)}>
      <span
        className={cx(
          "font-display leading-none tracking-[0.01em] uppercase",
          SIZES[size],
        )}
      >
        OddWay
      </span>
      <span aria-hidden="true" className="mt-1.5 h-px bg-current opacity-70" />
      <span aria-hidden="true" className="mt-[3px] h-px bg-current opacity-30" />
    </span>
  );
}
