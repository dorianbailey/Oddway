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
export function normaliseCategories(
  stops: Array<{ category: string; name: string }>,
): Record<string, number> {
  const changed: Record<string, number> = {};

  for (const stop of stops) {
    const mapped = CATEGORY_ALIASES[stop.category];
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
