/**
 * Maps research categories onto the seven the database actually has.
 *
 * Every batch arrives with categories that describe the place accurately and
 * are not in the enum — `vampire-lore`, `paleontology`, `odd-shops`. That is
 * not a mistake in the research; it is a person describing a thing precisely,
 * and the schema being deliberately coarse. Delaware brought ten of them and
 * Connecticut twenty-three.
 *
 * Rewriting this map inline for each state meant the same decision being made
 * again from scratch every time, with no guarantee the answer matched. Here it
 * is written down once, so `ruins` means the same thing in Ohio as it does in
 * Connecticut.
 *
 * The mapping is by what the stops actually are, not by the word:
 *   - `paleontology` covers dinosaur trackway parks, which people visit as
 *     museums even when the roof is the sky.
 *   - `ruins` covers abandoned villages and zoos: places with a history that
 *     ended, which is weird history rather than folklore.
 *   - `cemeteries` is weird history unless the entry is about a haunting.
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  // Haunted
  paranormal: "haunted",
  "paranormal-history": "haunted",
  "haunted-attractions": "haunted",
  "dark-rides": "haunted",
  ghost: "haunted",

  // Folklore
  "vampire-lore": "folklore",
  "pirate-lore": "folklore",
  mysteries: "folklore",
  "strange-names": "folklore",
  legend: "folklore",

  // Cryptids
  cryptid: "cryptids",

  // Weird history
  "dark-history": "weird-history",
  "macabre-history": "weird-history",
  "industrial-history": "weird-history",
  archaeology: "weird-history",
  cemeteries: "weird-history",
  crypts: "weird-history",
  relics: "weird-history",
  ruins: "weird-history",
  "ghost-town": "weird-history",
  "ghost-towns": "weird-history",
  "industrial-ruins": "weird-history",
  "aviation-history": "weird-history",
  "transportation-history": "weird-history",
  "religious-history": "weird-history",
  monuments: "weird-history",
  /*
    A claim about where something was invented is a historical claim, whatever
    is being served today. Louis' Lunch is a working hamburger restaurant and
    the reason to stop is the argument about 1900.
  */
  "food-history": "weird-history",

  // Museums
  museum: "museums",
  "medical-museum": "museums",
  "horror-museum": "museums",
  "living-history": "museums",
  transportation: "museums",
  paleontology: "museums",

  /*
    Places rather than collections. A lava flow and a moon rock on a plinth are
    things you pull over to look at, not institutions you visit — and a diner
    that gives you books with your meal is a roadside oddity that happens to
    serve food.
  */
  geology: "roadside-oddities",
  space: "roadside-oddities",
  "odd-restaurants": "roadside-oddities",

  // Roadside oddities
  "architectural-oddities": "roadside-oddities",
  "industrial-oddities": "roadside-oddities",
  "art-oddities": "roadside-oddities",
  "public-art": "roadside-oddities",
  "outsider-art": "roadside-oddities",
  "folk-art": "roadside-oddities",
  "odd-shops": "roadside-oddities",
  "religious-oddities": "roadside-oddities",
  "pop-culture": "roadside-oddities",


  /*
    Massachusetts brought eighty-nine of these in one state, most of them
    compounds: cryptids-and-folklore, geology-and-folklore, folklore-and-history.
    Compounds are filed under the more specific half, because somebody browsing
    cryptids wants the cryptid and somebody browsing folklore will find it
    through the story anyway.
  */
  "cryptid-art": "cryptids",
  "cryptids-and-folklore": "cryptids",
  "cryptids-and-monsters": "cryptids",

  "folklore-and-geology": "folklore",
  "folklore-and-history": "folklore",
  "geology-and-folklore": "folklore",
  "hoaxes-and-legends": "folklore",
  "good-luck-oddities": "folklore",
  "religious-folk-art": "folklore",
  "sacred-spaces": "folklore",
  "ufo-lore": "ufos",

  "dark-attractions": "haunted",
  "occult-history": "haunted",

  archives: "museums",
  "industrial-museum": "museums",
  "literary-museum": "museums",
  "occult-museum": "museums",
  "odd-museums": "museums",
  "pirate-museum": "museums",
  "macabre-books": "museums",

  /*
    Anything ending in -history goes to weird history, including the ones that
    sound like they belong elsewhere. A claim about where the first telephone
    call happened is a historical claim about a building, not an oddity beside
    a road.
  */
  "architectural-history": "weird-history",
  "communications-history": "weird-history",
  "hidden-history": "weird-history",
  "indigenous-history": "weird-history",
  "literary-history": "weird-history",
  "maritime-history": "weird-history",
  "medical-history": "weird-history",
  "military-history": "weird-history",
  "pirate-history": "weird-history",
  "pseudo-history": "weird-history",
  "revolutionary-history": "weird-history",
  "science-history": "weird-history",
  "space-history": "weird-history",
  "sports-history": "weird-history",
  "witch-trial-history": "weird-history",
  "bridge-ruins": "weird-history",
  "military-ruins": "weird-history",
  "lost-places": "weird-history",
  shipwrecks: "weird-history",
  "urban-archaeology": "weird-history",
  "true-crime": "weird-history",
  monuments: "weird-history",

  /*
    Odd monuments part company with monuments proper. A war memorial is
    history; a memorial to a potato shed is a thing you pull over for.
  */
  "odd-monuments": "roadside-oddities",
  "acoustic-oddities": "roadside-oddities",
  "agricultural-oddities": "roadside-oddities",
  "geological-oddities": "roadside-oddities",
  "guerrilla-art": "roadside-oddities",
  "hidden-art": "roadside-oddities",
  "hidden-oddities": "roadside-oddities",
  "historic-inn": "roadside-oddities",
  "literary-oddities": "roadside-oddities",
  "maritime-oddities": "roadside-oddities",
  "measurement-oddities": "roadside-oddities",
  "miniature-railroad": "roadside-oddities",
  "natural-oddities": "roadside-oddities",
  "odd-cafes": "roadside-oddities",
  "political-oddities": "roadside-oddities",
  "science-oddities": "roadside-oddities",
  "sound-art": "roadside-oddities",
  "street-art": "roadside-oddities",
  "tiny-oddities": "roadside-oddities",
  "transportation-oddities": "roadside-oddities",


  /*
    Rhode Island and New Hampshire. Several of these were decided by looking at
    the single stop that carried them rather than the word:
      ghost-lore        the Palatine Graves, a wreck story attached to a burial
      underground       Fort Adams' tunnels, so a fortification not a cave
      caves             the Polar Caves, a commercial attraction people drive to
      natural-mysteries a drowned forest, which is geology with a story on top
      secret-societies  a Dartmouth society's tomb room
      magic-history     a magician's grave
      seasonal-oddities the Ice Castles, built new each winter
  */
  abandoned: "weird-history",
  "abandoned-attractions": "weird-history",
  "abandoned-sports": "weird-history",
  "film-history": "weird-history",
  "maritime-ruins": "weird-history",
  mausoleums: "weird-history",
  "unusual-graves": "weird-history",
  "unusual-cemeteries": "weird-history",
  "war-history": "weird-history",
  underground: "weird-history",
  "lost-landmarks": "weird-history",
  "magic-history": "weird-history",
  mines: "weird-history",
  "political-history": "weird-history",
  "rebellion-history": "weird-history",
  "secret-societies": "weird-history",

  "ghost-lore": "haunted",

  "occult-lore": "folklore",
  "religious-mysteries": "folklore",
  "campus-lore": "folklore",
  "devil-lore": "folklore",
  "natural-mysteries": "folklore",
  "roadside-folklore": "folklore",
  "witch-lore": "folklore",

  "ufo-history": "ufos",

  "odd-collections": "museums",

  "geographic-oddities": "roadside-oddities",
  "unusual-monuments": "roadside-oddities",
  caves: "roadside-oddities",
  "engineering-oddities": "roadside-oddities",
  "military-oddities": "roadside-oddities",
  "roadside-attractions": "roadside-oddities",
  "seasonal-oddities": "roadside-oddities",
  "strange-art": "roadside-oddities",


  /*
    Maine. Most of what arrived here was a singular form of something already
    mapped — odd-museum, natural-oddity, engineering-oddity — which the
    normaliser now handles on its own rather than requiring both spellings.
    These are the ones that are actually new.
  */
  "cemetery-oddity": "weird-history",
  cryptozoology: "cryptids",
  "cryptid-folklore": "cryptids",
  "dark-folklore": "folklore",
  "folklore-art": "folklore",
  "haunted-lighthouse": "haunted",
  "film-location": "weird-history",
  "natural-history": "museums",
  "strange-science": "museums",
  "morbid-oddity": "weird-history",
  shipwreck: "weird-history",
  "weird-geography": "roadside-oddities",
  "architecture-oddity": "roadside-oddities",

  // UFOs
  ufo: "ufos",
};

export const VALID_CATEGORIES = new Set([
  "cryptids",
  "folklore",
  "haunted",
  "ufos",
  "weird-history",
  "museums",
  "roadside-oddities",
]);

/**
 * Normalises a batch in place and reports what it changed.
 *
 * Throws on anything unmappable rather than guessing. A wrong category is a
 * stop filed where nobody browsing for it will look, which is a quiet way of
 * losing it.
 */
/**
 * Tries the singular and plural of a category before giving up.
 *
 * Research arrives with odd-museum in one state and odd-museums in another,
 * natural-oddity here and natural-oddities there. Listing both spellings of
 * everything is busywork that never finishes, and forgetting one is a failed
 * import for a reason nobody would guess from the error.
 */
function forgiveNumber(category: string): string | undefined {
  const variants = [
    category.endsWith("s") ? category.slice(0, -1) : `${category}s`,
    category.endsWith("y") ? `${category.slice(0, -1)}ies` : undefined,
    category.endsWith("ies") ? `${category.slice(0, -3)}y` : undefined,
  ].filter((v): v is string => Boolean(v));

  for (const variant of variants) {
    if (CATEGORY_ALIASES[variant]) return CATEGORY_ALIASES[variant];
    if (VALID_CATEGORIES.has(variant)) return variant;
  }
  return undefined;
}

export function normaliseCategories(
  stops: Array<{ category: string; name: string }>,
): Record<string, number> {
  const changed: Record<string, number> = {};

  for (const stop of stops) {
    const mapped = CATEGORY_ALIASES[stop.category] ?? forgiveNumber(stop.category);
    if (mapped) {
      const key = `${stop.category} -> ${mapped}`;
      changed[key] = (changed[key] ?? 0) + 1;
      stop.category = mapped;
    }
    if (!VALID_CATEGORIES.has(stop.category)) {
      throw new Error(
        `No mapping for category "${stop.category}" (${stop.name}). ` +
          `Add it to CATEGORY_ALIASES rather than guessing here.`,
      );
    }
  }

  return changed;
}
