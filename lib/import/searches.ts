import type { CategorySlug } from "@/types/oddway";

/**
 * What to look for in OpenStreetMap, per category.
 *
 * Two-stage on purpose. `tags` is what Overpass is asked for, and it must be
 * tag-indexed — asking Overpass to regex every name in a state times out, as
 * found the hard way. `keywords` then filters those results locally, which is
 * free.
 *
 * Keyword lists are deliberately specific. Matching "monster" alone would drag
 * in every monster truck arena in the country.
 */
export interface CategorySearch {
  category: CategorySlug;
  /** Overpass tag filters. Each becomes one clause in the union. */
  tags: string[];
  /** Matched case-insensitively against name and description. */
  keywords: string[];
}

/** Tag filters worth scanning for almost any roadside oddity. */
const ATTRACTION_TAGS = [
  '["tourism"~"^(museum|attraction|artwork|theme_park)$"]',
  '["historic"~"^(memorial|monument)$"]',
  '["man_made"="statue"]',
];

export const CATEGORY_SEARCHES: CategorySearch[] = [
  {
    category: "cryptids",
    tags: ATTRACTION_TAGS,
    keywords: [
      "mothman",
      "bigfoot",
      "sasquatch",
      "yeti",
      "cryptid",
      "flatwoods monster",
      "braxton county monster",
      "jackalope",
      "chupacabra",
      "skunk ape",
      "jersey devil",
      "snallygaster",
      "lizard man",
      "michigan dogman",
      "goatman",
      "hodag",
      "wampus beast",
      "fouke monster",
      "boggy creek",
      "loveland frog",
      "champ the",
      "lake champlain monster",
      "pope lick",
      "beast of bray road",
      "van meter visitor",
      "melon heads",
      "nain rouge",
    ],
  },
  {
    category: "haunted",
    /*
      No amenity=prison and no healthcare tags. Those return working
      correctional facilities and functioning psychiatric hospitals, and an
      index that tells travellers to go and look at either is indefensible.
      The historic ones worth visiting — Eastern State, the West Virginia
      Penitentiary — are tagged as attractions or museums anyway.

      tourism=hotel is included because haunted hotels are often tagged only
      that way, but it makes each query far heavier. Use --tile 3 for this
      category.
    */
    tags: [
      ...ATTRACTION_TAGS,
      '["tourism"="hotel"]',
      '["historic"="ruins"]',
    ],
    keywords: [
      "haunted",
      "haunted house",
      "ghost tour",
      "ghost walk",
      "poltergeist",
      "asylum",
      "sanatorium",
      "sanitarium",
      "lunatic",
      "penitentiary",
      "paranormal",
      "spirit tour",
      "séance",
      "seance",
    ],
  },
  {
    category: "ufos",
    tags: ATTRACTION_TAGS,
    keywords: [
      "ufo",
      "u.f.o",
      "flying saucer",
      "alien",
      "extraterrestrial",
      "area 51",
      "spacecraft crash",
      "close encounter",
      "abduction site",
      "kecksburg",
      "little green men",
      "saucer crash",
      "international ufo",
    ],
  },
  {
    /*
      Local legend attached to a place: the hill cars roll up, the bridge you
      hear a baby crying on, the grave with a story. This is what travellers
      actually ask locals about, and it is almost never tagged as anything but
      a bridge or a road — so the keywords have to be the legend's name rather
      than the feature's type.
    */
    category: "folklore",
    tags: [
      ...ATTRACTION_TAGS,
      '["historic"="wayside_shrine"]',
      '["tourism"="viewpoint"]',
    ],
    keywords: [
      "gravity hill",
      "magnetic hill",
      "crybaby bridge",
      "cry baby bridge",
      "spook light",
      "ghost light",
      "witch grave",
      "witches grave",
      "witch's grave",
      "witches circle",
      "devil's tramping ground",
      "devils tramping ground",
      "lovers leap",
      "lover's leap",
      "la llorona",
      "legend of",
      "seven gates of hell",
      "haunted bridge",
    ],
  },
  {
    /*
      Ghost towns live here rather than under haunted. They are abandoned
      settlements — mining camps that ran out of ore — and grouping them with
      haunted houses means anyone filtering for haunted gets a dozen empty
      desert towns. Centralia was already filed this way.
    */
    category: "weird-history",
    tags: [...ATTRACTION_TAGS, '["historic"="ruins"]', '["place"="locality"]'],
    keywords: [
      "ghost town",
      "ghost city",
      "abandoned town",
      "abandoned mine",
      "mining camp",
      "boom town",
    ],
  },
  {
    /*
      The superlative is the giveaway. A thing is a roadside oddity because
      somebody decided it should be the largest, tallest or strangest of its
      kind and put it where cars would pass.

      Two keywords were removed rather than kept: "house of" matched House of
      Pizza and House of Blues nationwide, and "big boy" matched every branch
      of the restaurant chain. A keyword that needs a hundred exclusions is the
      wrong keyword.
    */
    category: "roadside-oddities",
    tags: [...ATTRACTION_TAGS, '["tourism"="viewpoint"]'],
    keywords: [
      "world's largest",
      "worlds largest",
      "world's biggest",
      "worlds biggest",
      "world's tallest",
      "worlds tallest",
      "world's smallest",
      "worlds smallest",
      "largest ball of",
      "giant ball",
      "muffler man",
      "paul bunyan",
      "jolly green giant",
      "carhenge",
      "cadillac ranch",
      "upside down house",
      "mystery spot",
      "mystery hole",
      "enchanted highway",
      "roadside giant",
      "giant statue",
      "big chair",
      "biggest ball",
    ],
  },
];

export function getCategorySearch(
  category: CategorySlug,
): CategorySearch | undefined {
  return CATEGORY_SEARCHES.find((search) => search.category === category);
}

/**
 * Place names that share a word with a cryptid but have nothing to do with one.
 * "Thunderbird" was removed from the keyword list entirely: in North America it
 * overwhelmingly returns Kwakwaka'wakw and Haida totem poles and house posts,
 * which are Indigenous cultural and sacred works, not roadside curiosities.
 */
const EXCLUSIONS = [
  // Places that match a keyword but are working facilities, not attractions.
  // Sending sightseers to an operating prison or psychiatric hospital is
  // both useless and intrusive.
  /\bcorrectional\b/i,
  /\bdetention\b/i,
  /\bcounty jail\b/i,
  /\bstate prison\b/i,
  /\bhospital\b/i,
  /\bmedical cent(er|re)\b/i,
  /\bpsychiatric\b/i,
  /\bbehavioral health\b/i,
  /\btreatment cent(er|re)\b/i,
  /\brehabilitation\b/i,
  /\bbrewing\b/i,
  /\bbrewery\b/i,
  /\btaproom\b/i,
  /\bdistillery\b/i,
  /\bwinery\b/i,
  /\bsupermarket\b/i,
  /\bgrocery\b/i,
  /\bgiant eagle\b/i,
  /\bgiant food\b/i,
  /\bpizza\b/i,
  /\bmasonic\b/i,
  /\bcemetery\b/i,
  /\bairboat\b/i,
  /\btotem\b/i,
  /\bpole\b/i,
  /\bmesa\b/i,
  /\bbend\b/i,
  /\bplant farm\b/i,
  /\bmudslide\b/i,
];

/**
 * True when an OSM element's text mentions any of the keywords.
 *
 * Matching is on word boundaries, not substrings. "Catawampus" contains
 * "wampus" and is a word meaning askew; substring matching put it in the
 * cryptid list.
 */
export function matchesKeywords(
  tags: Record<string, string> | undefined,
  keywords: string[],
): string | null {
  if (!tags) return null;

  const haystack = [
    tags.name,
    tags["name:en"],
    tags.description,
    tags.alt_name,
  ]
    .filter(Boolean)
    .join(" ");

  if (!haystack) return null;
  if (EXCLUSIONS.some((pattern) => pattern.test(haystack))) return null;

  return (
    keywords.find((keyword) => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
    }) ?? null
  );
}
