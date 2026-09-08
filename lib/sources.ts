/**
 * Decides whether a source should be a link.
 *
 * Every entry in this index cites where its facts came from, and that stays
 * true — the citation is what separates a researched index from an aggregated
 * one, and hiding it would be worse than pointless.
 *
 * But a citation and a recommendation are different things. A museum's own
 * site tells a traveller the opening hours and whether it is shut for winter;
 * that is useful and worth linking. A rival travel guide's write-up of the
 * same place offers a visitor nothing they cannot get here, and sending them
 * to it does OddWay no favours.
 *
 * So those are still credited by name — the reader can see exactly where a
 * claim came from and go and check it — but they are not made clickable.
 */

/** Travel guides covering the same ground as OddWay. */
const COMPETING_GUIDES: Record<string, string> = {
  "atlasobscura.com": "Atlas Obscura",
  "roadsideamerica.com": "Roadside America",
  "onlyinyourstate.com": "Only In Your State",
  "thrillist.com": "Thrillist",
  "tripadvisor.com": "Tripadvisor",
  "yelp.com": "Yelp",
  "mapcarta.com": "Mapcarta",
  "atlasobscura.co.uk": "Atlas Obscura",
};

export interface SourceInfo {
  /** Display name: a publication where known, otherwise the domain. */
  label: string;
  /** Absolute URL, or null when it should be credited without linking. */
  href: string | null;
}

export function describeSource(raw: string): SourceInfo {
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let host: string;
  let path = "";
  try {
    const parsed = new URL(url);
    host = parsed.host.replace(/^www\./, "").toLowerCase();
    path = parsed.pathname === "/" ? "" : parsed.pathname;
  } catch {
    return { label: raw, href: null };
  }

  const competitor = Object.keys(COMPETING_GUIDES).find(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );

  if (competitor) {
    return { label: COMPETING_GUIDES[competitor], href: null };
  }

  return { label: host + path, href: url };
}
