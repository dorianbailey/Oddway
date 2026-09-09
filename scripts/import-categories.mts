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


  /*
    North Carolina. A few decided by the stop rather than the word:
      ancient-mystery      Judaculla Rock, a petroglyph with a Cherokee story
      animal-oddity        wild horses and white squirrels, mostly
      living-oddity        Love Valley, a town that allows horses and not cars
      mystery-spot         Mystery Hill, one of the tilted rooms
      cryptid-museum       filed under cryptids rather than museums, so it sits
                           beside the creatures it is about
  */
  "abandoned-history": "weird-history",
  "abandoned-infrastructure": "weird-history",
  "abandoned-theme-park": "weird-history",
  "celebrity-grave": "weird-history",
  "cold-war": "weird-history",
  "historical-mystery": "weird-history",
  "music-history": "weird-history",
  "strange-history": "weird-history",

  "ancient-mystery": "folklore",
  "cemetery-folklore": "folklore",
  "folk-tradition": "folklore",

  "ghost-story": "haunted",
  "haunted-history": "haunted",

  "cryptid-museum": "cryptids",
  "ufo-folklore": "ufos",
  "medical-oddity": "museums",

  "ancient-oddity": "roadside-oddities",
  "animal-oddity": "roadside-oddities",
  "aviation-oddity": "roadside-oddities",
  "giant-statue": "roadside-oddities",
  "hidden-infrastructure": "roadside-oddities",
  "interactive-art": "roadside-oddities",
  "living-oddity": "roadside-oddities",
  "monster-truck-oddity": "roadside-oddities",
  "mystery-spot": "roadside-oddities",
  "oddities-bar": "roadside-oddities",
  "oddities-shop": "roadside-oddities",
  "tiny-building": "roadside-oddities",
  "vintage-theme-park": "roadside-oddities",
  "visionary-art": "roadside-oddities",


  /*
    South Carolina. animal-grave and animal-monument are separated on purpose:
    Poogan's Grave is a real grave and belongs with the other burials, while a
    statue of a border collie is a thing you pull over for.
  */
  "animal-grave": "weird-history",
  "church-ruins": "weird-history",
  "nuclear-history": "weird-history",
  "buried-alive-folklore": "folklore",
  "geological-mysteries": "folklore",
  "ghost-lights": "folklore",
  "local-characters": "folklore",
  "animal-monument": "roadside-oddities",
  "cultural-oddity": "roadside-oddities",
  "giant-oddity": "roadside-oddities",
  "nuclear-oddity": "roadside-oddities",
  "religious-art": "roadside-oddities",
  "vintage-oddity": "roadside-oddities",


  /*
    Six southern and midwestern states at once, ninety-five categories.

    Classified by the noun each ends in — a thing ending -museum is a museum,
    -history is weird history, -oddity or -art is something you pull over for.
    Five are overridden where the noun misleads: a roadside memorial to a
    circus elephant is not history in the sense this index means, and neither
    is a neon sign.
  */
  "ancient-sites": "weird-history",
  "atomic-history": "weird-history",
  "bar-oddities": "roadside-oddities",
  "caves-and-history": "weird-history",
  "caves-and-wildlife": "roadside-oddities",
  "cemetery-architecture": "weird-history",
  "cemetery-art": "weird-history",
  "cemetery-history": "weird-history",
  "cemetery-lore": "folklore",
  "civil-rights-and-food-history": "weird-history",
  "civil-rights-history": "weird-history",
  "civil-war-dark-history": "weird-history",
  "civil-war-oddities": "roadside-oddities",
  "colonial-history": "weird-history",
  "crime-history": "weird-history",
  "cryptid-lore": "cryptids",
  "cryptid-statue": "cryptids",
  "engineering-history": "weird-history",
  "fantasy-oddity": "roadside-oddities",
  "flag-history": "weird-history",
  "folklore-museums": "folklore",
  "food-oddities": "roadside-oddities",
  forts: "weird-history",
  "frontier-history": "weird-history",
  "game-culture": "roadside-oddities",
  "geography-oddities": "roadside-oddities",
  "haunted-cemetery": "haunted",
  "haunted-lore": "haunted",
  "haunted-mansion": "haunted",
  "historic-houses": "weird-history",
  "historic-mansion": "weird-history",
  "historic-oddity": "roadside-oddities",
  "historic-structures": "weird-history",
  "human-oddity": "roadside-oddities",
  "industrial-and-slavery-history": "weird-history",
  "infrastructure-oddities": "roadside-oddities",
  "interior-oddities": "roadside-oddities",
  "labor-cemetery": "weird-history",
  "labor-history": "weird-history",
  "lincoln-history": "weird-history",
  "lost-history": "weird-history",
  "lost-settlements": "roadside-oddities",
  "macabre-museum": "museums",
  "military-museum": "museums",
  "miniature-oddity": "roadside-oddities",
  "mob-history": "weird-history",
  "monument-oddity": "roadside-oddities",
  "music-and-sacred-history": "weird-history",
  "music-dark-history": "weird-history",
  "music-industry": "roadside-oddities",
  "music-oddities": "roadside-oddities",
  "neon-history": "roadside-oddities",
  "odd-traditions": "folklore",
  oddities: "roadside-oddities",
  "old-west-history": "weird-history",
  "outlaw-lore": "folklore",
  "outsider-architecture": "roadside-oddities",
  "photography-history": "weird-history",
  "pop-culture-museum": "museums",
  "presidential-graves": "weird-history",
  "presidential-history": "weird-history",
  "presidential-oddities": "roadside-oddities",
  "print-history": "weird-history",
  "prison-history": "weird-history",
  "public-art-oddities": "roadside-oddities",
  "railroad-dark-history": "weird-history",
  "railroad-folklore": "folklore",
  "railroad-history": "weird-history",
  "railroad-oddity": "roadside-oddities",
  "reconstructed-history": "weird-history",
  "revolution-history": "weird-history",
  "roadside-architecture": "roadside-oddities",
  "roadside-giant": "roadside-oddities",
  "roadside-history": "weird-history",
  "roadside-kitsch": "roadside-oddities",
  "roadside-memorial": "roadside-oddities",
  "roadside-monument": "roadside-oddities",
  "roadside-museum": "museums",
  "route-66": "roadside-oddities",
  "route-66-museum": "museums",
  "ruins-history": "weird-history",
  "slavery-history": "weird-history",
  "sound-oddities": "roadside-oddities",
  "space-oddities": "roadside-oddities",
  "strange-legal-history": "weird-history",
  "street-oddities": "roadside-oddities",
  "submerged-history": "weird-history",
  "themed-attractions": "roadside-oddities",
  "transportation-museum": "museums",
  "underground-venues": "roadside-oddities",
  "unusual-traditions": "folklore",
  "utopian-history": "weird-history",
  "voodoo-history": "folklore",
  "worlds-fair-oddities": "roadside-oddities",
  "worlds-largest": "roadside-oddities",


  /*
    Florida. "lighthouse" is weird history rather than a roadside oddity —
    people climb them for the view and the wreck stories, and they are almost
    all ticketed. "lost-attraction" is a place that no longer exists, which is
    history by definition.
  */
  architecture: "roadside-oddities",
  "eccentric-home": "roadside-oddities",
  roadside: "roadside-oddities",
  "underwater-oddity": "roadside-oddities",
  lighthouse: "weird-history",
  "lost-attraction": "weird-history",
  memorial: "weird-history",
  "oddities-museum": "museums",


  /*
    Iowa. "fossils" covers gorges and collecting preserves — places you walk
    into rather than institutions, so roadside rather than museums.
    "lost-communities" is abandoned townsites, which is history.
  */
  fossils: "roadside-oddities",
  "hidden-gardens": "roadside-oddities",
  "hidden-interiors": "roadside-oddities",
  "historic-rides": "roadside-oddities",
  "mechanical-oddities": "roadside-oddities",
  "urban-oddities": "roadside-oddities",
  "lost-communities": "weird-history",


  /*
    Georgia. Two decided by the stop rather than the word:
      controversial-monuments  Stone Mountain's carving, which is history rather
                               than a thing you pull over to enjoy
      time-capsules            the Crypt of Civilization, sealed until 8113
  */
  "archaeological-mysteries": "folklore",
  "archaeological-sites": "weird-history",
  "battlefield-history": "weird-history",
  "cemetery-monuments": "weird-history",
  "civil-war-history": "weird-history",
  "colonial-ruins": "weird-history",
  "controversial-monuments": "weird-history",
  "folk-history": "weird-history",
  "historic-landscapes": "weird-history",
  "institutional-history": "weird-history",
  "literary-sites": "weird-history",
  "mansion-ruins": "weird-history",
  "military-landscapes": "weird-history",
  "military-monuments": "weird-history",
  "remote-history": "weird-history",
  "rock-art": "weird-history",
  "strange-mansions": "weird-history",
  "swamp-history": "weird-history",
  "time-capsules": "weird-history",
  "underground-history": "weird-history",
  "war-damaged-history": "weird-history",
  "local-traditions": "folklore",
  "money-oddities": "museums",
  "aquatic-oddities": "roadside-oddities",
  "automotive-oddities": "roadside-oddities",
  "dark-sky": "roadside-oddities",
  "giant-art": "roadside-oddities",
  "giant-objects": "roadside-oddities",
  "giant-trees": "roadside-oddities",
  "mineral-springs": "roadside-oddities",
  "mountain-oddities": "roadside-oddities",
  "roadside-art": "roadside-oddities",
  "roadside-classics": "roadside-oddities",
  "strange-architecture": "roadside-oddities",
  "strange-landscapes": "roadside-oddities",
  "strange-monuments": "roadside-oddities",
  "strange-statues": "roadside-oddities",
  "swamp-oddities": "roadside-oddities",
  "weird-weapons": "roadside-oddities",

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
