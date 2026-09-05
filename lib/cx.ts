/** Join conditional class names. Keeps `clsx` out of the dependency list. */
export function cx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
