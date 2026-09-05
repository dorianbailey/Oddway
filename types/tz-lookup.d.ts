/**
 * tz-lookup ships no types. It exports a single function mapping coordinates
 * to an IANA timezone, throwing for points outside any zone.
 */
declare module "tz-lookup" {
  export default function tzLookup(
    latitude: number,
    longitude: number,
  ): string;
}
