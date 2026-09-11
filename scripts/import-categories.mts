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
  /*
    Added for the Nevada and Oklahoma research batches. Each follows the
    spelling already in this map rather than a fresh judgement:
    ufo-* is ufos, *-ruins is weird-history, cryptid-* is cryptids,
    optical-oddities is roadside-oddities, route-66 is roadside-oddities,
    outlaws is weird-history, archaeological-mysteries is folklore.
  */
  /*
    Added for the New Mexico batch, each following the spelling already here:
    ufo-* is ufos, historic-houses is weird-history, trail-history is
    weird-history, homestead-history is weird-history, *-oddities is
    roadside-oddities, and emigrant-inscriptions — the same thing El Morro is —
    is weird-history.
  */
  "ufo-roadside": "ufos",
  "historic-homes": "weird-history",
  "historic-ranches": "weird-history",
  "route-history": "weird-history",
  "border-history": "weird-history",
  "historic-graffiti": "weird-history",
  "natural-spectacle": "roadside-oddities",
  /* Added for the Washington batch. */
  "monumental-oddities": "roadside-oddities",
  "geology-folklore": "folklore",
  "name-oddities": "roadside-oddities",
  "giant-roadside-art": "roadside-oddities",
  /*
    Added for the Washington, D.C. batch, which arrived with 48 spellings the
    map had not seen — a city's worth of vocabulary rather than a state's.
    Each was checked against the stop it describes; five are deliberately not
    where the suggestion put them and say so.
  */
  espionage: "museums",                    // the Spy Museum is a museum, not an oddity
  "espionage-history": "weird-history",
  "unusual-museum": "museums",
  "historic-library": "weird-history",
  "space-relic": "roadside-oddities",
  "miniature-monument": "roadside-oddities",
  "wetland-oddity": "roadside-oddities",
  "book-sculpture": "roadside-oddities",
  "geographic-marker": "roadside-oddities",
  inventions: "museums",                   // the patent model collection is a museum
  "historic-estate": "weird-history",
  "historic-recreation": "weird-history",
  "maritime-memorial": "weird-history",
  "science-memorial": "weird-history",
  "historic-market": "weird-history",
  "hidden-detail": "roadside-oddities",
  island: "roadside-oddities",
  "library-oddity": "roadside-oddities",
  "science-fiction-relic": "museums",
  "rare-books": "museums",
  "asylum-history": "weird-history",
  "civil-war-ruins": "weird-history",
  "civil-war-lore": "folklore",
  "sacred-architecture": "roadside-oddities",
  "fraternal-architecture": "roadside-oddities",
  "giant-roadside-object": "roadside-oddities",
  "strange-sculpture": "roadside-oddities",
  "computing-relic": "museums",            // the bug is a Smithsonian exhibit
  "dinosaur-sculpture": "roadside-oddities", // Uncle Beazley stands outdoors at the zoo
  "dinosaur-history": "weird-history",
  "assassination-history": "weird-history",
  "forgotten-infrastructure": "weird-history",
  taxidermy: "museums",                    // Martha is a museum specimen in a case
  "activism-history": "weird-history",
  "historic-carousel": "roadside-oddities",
  "street-design": "roadside-oddities",
  "railroad-ruin": "weird-history",
  "hidden-architecture": "roadside-oddities",
  mural: "roadside-oddities",
  "political-lore": "folklore",
  "found-object-art": "roadside-oddities",
  "military-artifact": "weird-history",
  "film-memorabilia": "museums",
  "odd-memorial": "roadside-oddities",
  "tiny-park": "roadside-oddities",
  "architectural-anomaly": "roadside-oddities",
  "observation-tower": "roadside-oddities",
  "bell-tower": "roadside-oddities",
  /* Added for the Missouri batch. */
  mills: "roadside-oddities",
  geography: "roadside-oddities",
  "historic-infrastructure": "weird-history",
  "prehistoric-history": "weird-history",
  "worlds-fair-history": "weird-history",
  extraterrestrial: "ufos",
  "route-66-history": "roadside-oddities",
  "cryptid-roadside": "cryptids",
  "optical-illusion": "roadside-oddities",
  "outlaw-history": "weird-history",
  "archaeology-lore": "folklore",
  "architectural-ruins": "weird-history",
  "cryptid-art": "cryptids",  "cryptids-and-folklore": "cryptids",
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


  /*
    Texas. "animals" covers a bat colony under a bridge and a bat cave — things
    you turn up at dusk to watch, so roadside rather than a museum.
  */
  animals: "roadside-oddities",
  dinosaurs: "roadside-oddities",
  "odd-gardens": "roadside-oddities",
  "folk-culture": "folklore",
  outlaws: "weird-history",
  pirates: "folklore",


  /*
    Nebraska. "natural-phenomena" is the sandhill crane migration at Rowe
    Sanctuary — half a million birds on one stretch of river every March, which
    is a thing you turn up for rather than an institution.
  */
  "ancient-history": "weird-history",
  "black-history": "weird-history",
  "cultural-history": "weird-history",
  "fossil-history": "weird-history",
  "historic-sites": "weird-history",
  "road-history": "weird-history",
  "trail-history": "weird-history",
  "underground-railroad": "weird-history",
  "wartime-history": "weird-history",
  "paranormal-lore": "haunted",
  "natural-phenomena": "roadside-oddities",
  "scenic-geology": "roadside-oddities",
  waterfalls: "roadside-oddities",
  "wartime-oddities": "roadside-oddities",


  /*
    Montana, which arrived with spaced category names and a lot of them.

    Two worth explaining. "rockhounding" is Crystal Park, where you dig for
    quartz yourself, so a place rather than a collection. "animal-legend" is
    the Shep Memorial at Fort Benton — a dog who met every train for five and a
    half years waiting for an owner who had died.
  */
  "adaptive-reuse": "weird-history",
  "art-history": "weird-history",
  battlefield: "weird-history",
  "cold-war-history": "weird-history",
  "disaster-history": "weird-history",
  "environmental-history": "weird-history",
  "expedition-history": "weird-history",
  "forest-service-history": "weird-history",
  "grave-site": "weird-history",
  "historic-bridge": "weird-history",
  "historic-district": "weird-history",
  "historic-mission": "weird-history",
  "historic-theater": "weird-history",
  "historic-village": "weird-history",
  "indigenous-art": "weird-history",
  "landmark-history": "weird-history",
  "local-history": "weird-history",
  "mining-history": "weird-history",
  "regional-history": "weird-history",
  "rock-art-expedition-history": "weird-history",
  "western-history": "weird-history",

  "animal-legend": "folklore",

  "aviation-museum": "museums",
  "dinosaur-museum": "museums",
  "history-museum": "museums",
  "machinery-museum": "museums",
  "technology-museum": "museums",

  "ancient-forest": "roadside-oddities",
  "badlands-geology": "roadside-oddities",
  "fossil-country": "roadside-oddities",
  "geological-landmark": "roadside-oddities",
  "outdoor-art": "roadside-oddities",
  rockhounding: "roadside-oddities",
  "sacred-art": "roadside-oddities",


  /*
    Idaho, which came in with eighty categories for a hundred and thirty stops
    — almost one apiece. Volcanic and lava anything is a thing you pull over
    for, museums are museums, and the rest went by the noun.

    Ten are overridden where the noun misleads. A historic hot spring is
    somewhere you get in the water, and the Evel Knievel monument at Twin Falls
    is a roadside monument whatever the history attached to it.
  */
  "archaeology-interpretation": "weird-history",
  astronomy: "roadside-oddities",
  "atomic-history-museum": "museums",
  aviation: "museums",
  "cabinet-of-curiosities-museum": "museums",
  canyon: "roadside-oddities",
  "canyon-overlook": "roadside-oddities",
  "developed-hot-springs": "roadside-oddities",
  "disaster-history-trail": "weird-history",
  "emigrant-inscriptions": "weird-history",
  "engineered-geyser": "roadside-oddities",
  engineering: "roadside-oddities",
  "engineering-disaster-site": "weird-history",
  "expedition-landmark": "weird-history",
  "folk-art-roadside-attraction": "roadside-oddities",
  "folklore-marker": "folklore",
  "fossil-landscape": "roadside-oddities",
  "frontier-history-museum": "museums",
  "geologic-disaster-site": "weird-history",
  "geologic-oddity": "roadside-oddities",
  "geologic-preserve": "roadside-oddities",
  "giant-dunes": "roadside-oddities",
  "gold-rush-museum": "museums",
  "granite-formation": "roadside-oddities",
  "historic-building": "weird-history",
  "historic-handcrafted-cabin": "weird-history",
  "historic-hot-springs": "roadside-oddities",
  "historic-hotel": "weird-history",
  "historic-hydroelectric-site": "weird-history",
  "historic-island": "roadside-oddities",
  "historic-mine-tour": "weird-history",
  "historic-prison": "weird-history",
  "historic-school": "weird-history",
  history: "weird-history",
  indigenous: "weird-history",
  "industrial-relic": "weird-history",
  "lava-cave": "roadside-oddities",
  "lava-field": "roadside-oddities",
  "lava-field-trail": "roadside-oddities",
  "lava-flow-trail": "roadside-oddities",
  "lava-tube": "roadside-oddities",
  "literary-memorial": "weird-history",
  "living-ghost-town": "weird-history",
  "local-history-museum": "museums",
  "logging-museum": "museums",
  "major-waterfall": "roadside-oddities",
  military: "weird-history",
  "military-history-museum": "museums",
  "mine-tour": "weird-history",
  mining: "weird-history",
  "mining-exhibit": "weird-history",
  "mining-museum": "museums",
  "mining-ruins": "weird-history",
  "natural-history-museum": "museums",
  "oregon-trail-historic-site": "weird-history",
  "oregon-trail-overlook": "weird-history",
  "outlaw-history-museum": "museums",
  "preserved-ghost-town": "weird-history",
  "private-curiosity-museum": "museums",
  "quirky-food-museum": "museums",
  "quirky-specialty-museum": "museums",
  "railroad-museum": "museums",
  "regional-history-museum": "museums",
  science: "museums",
  "show-cave": "roadside-oddities",
  "specialty-museum": "museums",
  spring: "roadside-oddities",
  "street-art-oddity": "roadside-oddities",
  "stunt-history-monument": "roadside-oddities",
  "trail-history-museum": "museums",
  "tribal-history-museum": "museums",
  "unusual-history-museum": "museums",
  "volcanic-formations": "roadside-oddities",
  "volcanic-geology": "roadside-oddities",
  "volcanic-landmark": "roadside-oddities",
  "volcanic-oddity-trail": "roadside-oddities",
  "volcanic-trail": "roadside-oddities",
  "volcanic-viewpoint": "roadside-oddities",
  "waterfall-trail": "roadside-oddities",
  "wwii-incarceration-history": "weird-history",


  /*
    Utah. "land-art" is the Spiral Jetty and the Sun Tunnels — enormous works
    made of the desert itself, which people drive hours of dirt road to stand
    next to. Roadside in the sense that matters.
  */
  "dinosaur-attractions": "roadside-oddities",
  "hot-springs": "roadside-oddities",
  "land-art": "roadside-oddities",
  "slot-canyons": "roadside-oddities",
  "speed-history": "weird-history",
  "space-science": "museums",


  /*
    North Dakota. "border-oddities" is the International Peace Garden, which
    straddles the Manitoba line and has a building with a door in each country.
  */
  "astronomical-oddities": "roadside-oddities",
  "border-oddities": "roadside-oddities",
  "industrial-art": "roadside-oddities",
  "film-oddities": "weird-history",
  "sacred-history": "weird-history",


  /*
    Hawaii and South Dakota.

    Three worth explaining. "indigenous-engineering" is the fishponds — walled
    coastal enclosures built centuries ago and still holding fish, which is
    engineering rather than a ruin. "sacred-sites" and "sacred-landscape" cover
    heiau and Bear Butte, places of active worship rather than exhibits, and
    both keep their descriptions' guidance about how to behave there.
  */
  "animal-history": "weird-history",
  "geographic-history": "weird-history",
  "geothermal-history": "weird-history",
  "indigenous-culture": "weird-history",
  "indigenous-engineering": "weird-history",
  "industrial-cultural-history": "weird-history",
  "memorial-history": "weird-history",
  "monumental-history": "weird-history",
  "preserved-history": "weird-history",
  "relocated-history": "weird-history",
  "royal-history": "weird-history",
  "sacred-landscape": "weird-history",
  "sacred-sites": "weird-history",

  "folklore-nature": "folklore",
  "survival-lore": "folklore",
  "mining-paranormal": "haunted",
  "roadside-cryptids": "cryptids",

  "art-museums": "museums",
  "fossil-museums": "museums",

  "caves-geology": "roadside-oddities",
  "engineered-landscape": "roadside-oddities",
  "geology-engineering": "roadside-oddities",
  "geothermal-oddities": "roadside-oddities",
  "historic-lookouts": "roadside-oddities",
  "monumental-art": "roadside-oddities",
  "optical-oddities": "roadside-oddities",
  "roadside-geography": "roadside-oddities",


  /*
    California. "prehistoric" is the La Brea Tar Pits, which is a museum built
    around an active excavation — filed as a museum because that is what you
    walk into.
  */
  "abandoned-modernism": "weird-history",
  "abandoned-places": "weird-history",
  "old-west": "weird-history",
  "dark-museums": "museums",
  prehistoric: "museums",
  "odd-theaters": "roadside-oddities",
  "ancient-trees": "roadside-oddities",
  "immersive-art": "roadside-oddities",
  "novelty-architecture": "roadside-oddities",
  "volcanic-landscapes": "roadside-oddities",


  /*
    Wyoming, which is mostly Yellowstone, the Oregon Trail and ghost towns.
  */
  "abandoned-homestead": "weird-history",
  "aviation-ruin": "weird-history",
  "fort-ruins": "weird-history",
  "historic-fort": "weird-history",
  "historic-mine": "weird-history",
  "historic-mining-town": "weird-history",
  "historic-ruin": "weird-history",
  prison: "weird-history",
  "stagecoach-station": "weird-history",
  "trail-landmark": "weird-history",
  badlands: "roadside-oddities",


  /*
    Colorado. "ancestral-pueblo" is the Mesa Verde cliff dwellings — filed as
    weird history rather than roadside, since every one of them is a ticketed
    ranger-led climb rather than somewhere you pull over and look.
  */
  "ancestral-pueblo": "weird-history",
  "ghost-town-history": "weird-history",
  "geology-history": "weird-history",
  "archaeology-museum": "museums",
  "fossil-dinosaur": "museums",
  "strange-collection": "museums",
  "strange-museum": "museums",
  "haunted-paranormal": "haunted",
  "ufo-paranormal": "ufos",
  "fossil-geology": "roadside-oddities",
  "geology-archaeology": "roadside-oddities",
  "geology-oddity": "roadside-oddities",
  "geology-overlook": "roadside-oddities",
  "unusual-architecture": "roadside-oddities",


  /*
    Arizona. "new-age-lore" is the Sedona vortexes — filed as folklore, which
    is where a belief about a place belongs whether or not it is true.
  */
  "botanical-oddities": "roadside-oddities",
  "neon-oddities": "roadside-oddities",
  "spiritual-sites": "roadside-oddities",
  "law-enforcement-oddities": "weird-history",
  "media-history": "weird-history",
  "new-age-lore": "folklore",


  /*
    Alaska. "transportation-ruins" is the Last Train to Nowhere — three
    locomotives rusting in the tundra outside Nome, hauled north for a railway
    that was never finished.
  */
  "cultural-landmarks": "roadside-oddities",
  "gold-rush-history": "weird-history",
  "homestead-history": "weird-history",
  "transportation-ruins": "weird-history",
  "unfinished-infrastructure": "weird-history",


  // Arkansas.
  "natural-wonders": "roadside-oddities",

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
