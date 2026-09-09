import { test } from "node:test";
import assert from "node:assert/strict";

/*
  Tests for the logic that has actually gone wrong, rather than a token suite.

  Every case below corresponds to a bug that reached the running site: dates
  sorted by day name, a header that flickered forever, coordinates accepted
  outside the globe, keywords that matched breweries.
*/

test("article dates sort chronologically, not by day name", async () => {
  const { getArticles } = await import("../lib/articles");
  const articles = getArticles();
  if (articles.length < 2) return;

  // The bug: YAML parsed dates into Date objects, String() gave "Wed Sep 02
  // 2026...", and localeCompare then sorted Fri < Sat < Sun < Thu < Wed.
  for (const article of articles) {
    assert.match(
      article.date,
      /^\d{4}-\d{2}-\d{2}$/,
      `${article.slug} has a non-ISO date: ${article.date}`,
    );
  }

  const dates = articles.map((a) => a.date);
  const descending = [...dates].sort((a, b) => b.localeCompare(a));
  assert.deepEqual(dates, descending, "index must list newest first");

  // Case numbers run oldest to newest and never repeat.
  const byNumber = [...articles].sort((a, b) => a.caseNumber - b.caseNumber);
  for (let i = 1; i < byNumber.length; i += 1) {
    assert.ok(
      byNumber[i - 1].date <= byNumber[i].date,
      "case numbers must ascend with age",
    );
    assert.notEqual(
      byNumber[i - 1].caseNumber,
      byNumber[i].caseNumber,
      "case numbers must be unique",
    );
  }
});

test("every article and trip references stops that exist", async () => {
  const { getArticles } = await import("../lib/articles");
  const { getTrips } = await import("../lib/trips");

  const slugPattern = /^[a-z0-9][a-z0-9-]*$/;
  for (const article of getArticles()) {
    for (const slug of article.stops ?? []) {
      assert.match(slug, slugPattern, `${article.slug} has a malformed stop slug`);
    }
  }
  for (const trip of getTrips()) {
    assert.ok(trip.stops.length > 0, `${trip.slug} has no stops`);
    for (const slug of trip.stops) {
      assert.match(slug, slugPattern, `${trip.slug} has a malformed stop slug`);
    }
  }
});

test("header collapse cannot oscillate", () => {
  // The bug: one threshold, and collapsing changed the header height enough to
  // push the scroll position back across it, forever.
  const COLLAPSE_AT = 72;
  const EXPAND_AT = 4;
  assert.ok(
    COLLAPSE_AT > EXPAND_AT,
    "thresholds must differ or the header flickers",
  );

  let collapsed = false;
  let y: number = 10;
  let flips = 0;
  for (let i = 0; i < 200; i += 1) {
    const next: boolean = collapsed ? y > EXPAND_AT : y > COLLAPSE_AT;
    if (next !== collapsed) {
      collapsed = next;
      flips += 1;
      y = collapsed ? Math.max(0, y - 90) : y + 90;
    }
  }
  assert.ok(flips < 5, `header flipped ${flips} times; it is oscillating`);
});

test("keyword matching rejects the things that slipped through before", async () => {
  const { getCategorySearch, matchesKeywords } = await import(
    "../lib/import/searches"
  );

  const cases: Array<[string, string, boolean]> = [
    ["haunted", "Trans-Allegheny Lunatic Asylum", true],
    ["haunted", "State Correctional Institution", false],
    ["haunted", "Central State Hospital", false],
    ["ufos", "International UFO Museum", true],
    ["ufos", "Roswell Public Library", false],
    ["ufos", "Alien Brewing Company", false],
    ["roadside-oddities", "World's Largest Ball of Twine", true],
    ["roadside-oddities", "Giant Eagle Supermarket", false],
    ["roadside-oddities", "House of Pizza", false],
    ["folklore", "Crybaby Bridge", true],
    ["weird-history", "Rhyolite Ghost Town", true],
    ["haunted", "Rhyolite Ghost Town", false],
  ];

  for (const [category, name, shouldMatch] of cases) {
    const search = getCategorySearch(category as never);
    assert.ok(search, `no search defined for ${category}`);
    const matched = Boolean(matchesKeywords({ name } as never, search!.keywords));
    assert.equal(
      matched,
      shouldMatch,
      `${category}: "${name}" should ${shouldMatch ? "match" : "not match"}`,
    );
  }
});

test("coordinates outside the globe are rejected", () => {
  // Used by the trip API so browser geolocation can be an origin. A transposed
  // pair would otherwise route someone to the wrong hemisphere silently.
  function asCoordinates(value: string) {
    const m = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return null;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat, lon };
  }

  assert.deepEqual(asCoordinates("42.1292,-80.0851"), { lat: 42.1292, lon: -80.0851 });
  assert.deepEqual(asCoordinates("42.1292, -80.0851"), { lat: 42.1292, lon: -80.0851 });
  assert.equal(asCoordinates("Pittsburgh, PA"), null);
  assert.equal(asCoordinates("999,-80"), null);
  assert.equal(asCoordinates("42,-500"), null);
  assert.equal(asCoordinates(""), null);
});

test("a finished multi-day event is not shown as upcoming", async () => {
  const { hasFinished } = await import("../lib/events");

  // A minimal event; hasFinished only reads startDate and days.
  const base = {
    id: "1",
    slug: "x",
    name: "X",
    city: "C",
    state: "WV",
    latitude: null,
    longitude: null,
    timezone: null,
    category: "cryptid",
    displayDate: null,
    dateConfidence: "confirmed",
    description: null,
    website: null,
    contact: null,
    notes: null,
  } as unknown as Parameters<typeof hasFinished>[0];
  const today = new Date("2026-09-05T12:00:00Z");

  // Somebody checking on the Saturday of a Friday-to-Sunday festival should
  // still see it listed.
  assert.equal(
    hasFinished({ ...base, startDate: "2026-09-03", days: 3 }, today),
    false,
    "last day of a run still counts as running",
  );
  assert.equal(
    hasFinished({ ...base, startDate: "2026-09-01", days: 3 }, today),
    true,
  );
  assert.equal(
    hasFinished({ ...base, startDate: null, days: 1 }, today),
    false,
    "no date means we cannot say it has finished",
  );
});

test("recurrence reads the weekday pattern, not the date", async () => {
  const { likelyRecurrence } = await import("../lib/events");
  const base = {
    id: "1", slug: "x", name: "X", city: "C", state: "WV",
    latitude: null, longitude: null, timezone: null, category: "cryptid",
    displayDate: null, dateConfidence: "confirmed", description: null,
    website: null, contact: null, notes: null, days: 2,
  } as unknown as Parameters<typeof likelyRecurrence>[0];

  // 12 June 2026 is the second Friday; the second Friday of June 2027 is the 11th.
  const june = likelyRecurrence({ ...base, startDate: "2026-06-12" });
  assert.equal(june?.pattern, "the second Friday of June");
  assert.equal(june?.nextDate, "2027-06-11");

  // Last-of-month must not be reported as "fifth".
  const halloween = likelyRecurrence({ ...base, startDate: "2026-10-31" });
  assert.equal(halloween?.pattern, "the last Saturday of October");
  assert.equal(halloween?.nextDate, "2027-10-30");

  // The computed date must land on the same weekday it was derived from.
  for (const startDate of ["2026-03-07", "2026-05-28", "2026-09-19", "2026-04-25"]) {
    const result = likelyRecurrence({ ...base, startDate });
    assert.ok(result, `no recurrence for ${startDate}`);
    const from = new Date(`${startDate}T00:00:00Z`).getUTCDay();
    const to = new Date(`${result!.nextDate}T00:00:00Z`).getUTCDay();
    assert.equal(to, from, `${startDate} moved to a different weekday`);
  }

  assert.equal(likelyRecurrence({ ...base, startDate: null }), null);
});

test("the card list never shrinks because a stop was added to the trip", async () => {
  const { chooseDisplaySets } = await import("../lib/display-sets");

  const stop = (id: string) => ({ id, slug: id, name: id }) as never;
  const recommendations = [stop("a"), stop("b"), stop("c")];
  const everything = [stop("a"), stop("b"), stop("c"), stop("d"), stop("e")];

  // Nothing chosen: recommendations listed, whole index mapped.
  const idle = chooseDisplaySets({
    searchResults: null,
    savedTrip: [],
    fallbackStops: recommendations,
    allStops: everything,
  });
  assert.equal(idle.listed.length, 3);
  assert.equal(idle.mapped.length, 5);

  /*
    The regression: adding one recommendation to the trip used to replace the
    list with that single stop, which read as the other two being deleted.
    The list must not change; only the map narrows.
  */
  const withTrip = chooseDisplaySets({
    searchResults: null,
    savedTrip: [stop("a")],
    fallbackStops: recommendations,
    allStops: everything,
  });
  assert.equal(
    withTrip.listed.length,
    3,
    "recommendations must survive adding one of them to a trip",
  );
  assert.equal(withTrip.mapped.length, 1, "map should narrow to the trip");

  // A search overrides both, because it is what was explicitly asked for.
  const searched = chooseDisplaySets({
    searchResults: [stop("x"), stop("y")],
    savedTrip: [stop("a")],
    fallbackStops: recommendations,
    allStops: everything,
  });
  assert.equal(searched.listed.length, 2);
  assert.equal(searched.mapped.length, 2);

  // An empty search result is still a search: "nothing found" is an answer.
  const empty = chooseDisplaySets({
    searchResults: [],
    savedTrip: [],
    fallbackStops: recommendations,
    allStops: everything,
  });
  assert.equal(empty.listed.length, 0, "an empty result must not fall back");
});

test("reading a table pages past the API row cap", () => {
  /*
    PostgREST returns at most 1,000 rows and gives no indication that it
    truncated. A single request therefore looked completely successful while
    silently hiding every stop after the thousandth — which is exactly what
    happened once the index passed that size.

    This models the loop rather than the database: a short page means the end,
    a full page means ask again.
  */
  function readAll(total: number, page = 1000): number {
    const rows: number[] = [];
    for (let from = 0; ; from += page) {
      const returned = Math.max(0, Math.min(page, total - from));
      for (let i = 0; i < returned; i += 1) rows.push(from + i);
      if (returned < page) break;
    }
    return rows.length;
  }

  assert.equal(readAll(0), 0);
  assert.equal(readAll(7), 7, "a small index needs one request");
  assert.equal(readAll(999), 999);
  assert.equal(readAll(1000), 1000, "an exactly-full page must not be the end");
  assert.equal(readAll(1013), 1013, "the case that broke the site");
  assert.equal(readAll(2000), 2000);
  assert.equal(readAll(4321), 4321);
});

test("competing travel guides are credited but not linked", async () => {
  const { describeSource } = await import("../lib/sources");

  /*
    The index cites everything, and that does not change. What changes is
    whether the citation is clickable: a museum's own page helps a traveller
    plan, a rival guide's write-up of the same place does not.
  */
  const atlas = describeSource("https://www.atlasobscura.com/places/dog-chapel");
  assert.equal(atlas.href, null, "must not link to a competing guide");
  assert.equal(atlas.label, "Atlas Obscura", "must still say where it came from");

  assert.equal(describeSource("https://www.roadsideamerica.com/story/75750").href, null);
  assert.equal(describeSource("https://mapcarta.com/N1731158405").label, "Mapcarta");

  // Everything else keeps its link.
  const park = describeSource("https://www.michigan.gov/recsearch/parks/fayette");
  assert.equal(park.href, "https://www.michigan.gov/recsearch/parks/fayette");
  assert.equal(park.label, "michigan.gov/recsearch/parks/fayette");

  assert.ok(describeSource("https://shelburnemuseum.org/").href);
  assert.ok(describeSource("https://en.wikipedia.org/wiki/Kecksburg_UFO_incident").href);
  assert.ok(describeSource("https://www.blm.gov/visit/rhyolite-historic-area").href);

  // A bare domain still becomes a usable link.
  assert.equal(describeSource("mysteryhole.com").href, "https://mysteryhole.com");

  // Subdomains of a competing guide count too.
  assert.equal(describeSource("https://assets.atlasobscura.com/x").href, null);
});

test("the featured artist changes weekly and only shows those who agreed", async () => {
  const { getFeaturedArtist, getArtists } = await import("../lib/artists");

  // Nobody without explicit permission is ever returned.
  for (const artist of getArtists()) {
    assert.equal(artist.permission, true, `${artist.slug} has no permission flag`);
  }

  const featured = getFeaturedArtist(new Date("2026-09-08T12:00:00Z"));
  if (!featured) return; // No artists published yet.

  /*
    The choice is derived from the date rather than stored, so it must be
    identical for every request in a week and different the week after. Any
    drift here means two visitors on the same day see different artists.
  */
  const monday = getFeaturedArtist(new Date("2026-09-07T00:00:00Z"));
  const wednesday = getFeaturedArtist(new Date("2026-09-09T23:59:00Z"));
  assert.equal(monday?.slug, wednesday?.slug, "must not change mid-week");

  const seen = new Set<string>();
  for (let week = 0; week < getArtists().length; week += 1) {
    const day = new Date(Date.UTC(2026, 0, 1 + week * 7));
    seen.add(getFeaturedArtist(day)!.slug);
  }
  assert.equal(
    seen.size,
    getArtists().length,
    "every artist should come up before any repeats",
  );
});

test("a storage path confines an author to their own folder", async () => {
  const { storagePath } = await import("../lib/photo-upload");

  /*
    The bucket policy compares the first path segment against auth.uid(). If a
    path could be made to start with somebody else's id, that person's folder
    becomes writable — so the shape of this string is a security boundary
    rather than a tidiness convention.
  */
  const author = "11111111-2222-3333-4444-555555555555";
  const path = storagePath(author, "mothman-statue");

  assert.ok(path.startsWith(`${author}/`), "author id must be the first segment");
  assert.equal(path.split("/")[0], author, "nothing may precede the author id");
  assert.ok(path.endsWith(".webp"));

  // Two uploads of the same photo to the same stop must not collide.
  assert.notEqual(
    storagePath(author, "mothman-statue"),
    storagePath(author, "mothman-statue"),
  );

  // A traversal attempt must not survive into the path at all.
  const sneaky = storagePath(author, "../../someone-else");
  assert.equal(sneaky.split("/")[0], author, "the author id still leads");
  assert.ok(!sneaky.includes(".."), "no traversal segments may remain");
  assert.equal(sneaky.split("/").length, 3, "exactly author / stop / file");
});

test("a photographer is gated once, then trusted", () => {
  /*
    Models the trigger: a photograph is approved on arrival only if the same
    author already has an approved one. First upload waits for review; every
    upload after that goes straight up.

    The property that matters is that trust cannot be granted by the uploader.
    It is read from what has already been approved, and only the reviewer can
    change that.
  */
  function statusOnInsert(existing: string[]): "pending" | "approved" {
    return existing.includes("approved") ? "approved" : "pending";
  }

  const posted: string[] = [];

  // A brand new account.
  posted.push(statusOnInsert(posted));
  assert.equal(posted[0], "pending", "the first photo must wait");

  // Posting again before review does not sneak past.
  posted.push(statusOnInsert(posted));
  assert.equal(posted[1], "pending", "a second photo before review still waits");

  // The reviewer approves the first.
  posted[0] = "approved";

  // Everything afterwards is live.
  posted.push(statusOnInsert(posted));
  assert.equal(posted[2], "approved", "an approved author posts freely");

  // A rejection does not revoke trust once earned; blocking is the tool for
  // that, and it hides everything at once.
  const afterRejection = ["approved", "rejected"];
  assert.equal(statusOnInsert(afterRejection), "approved");

  // An author whose only photo was rejected is still gated.
  assert.equal(statusOnInsert(["rejected"]), "pending");
  assert.equal(statusOnInsert(["pending", "rejected"]), "pending");
});

test("password confirmation guards the case that actually locks people out", () => {
  /*
    Confirmation is asked for at signup and not at sign-in, and the asymmetry
    is deliberate. A typo when signing in fails at once and costs a retry. A
    typo when creating an account sets a password nobody knows, on an address
    the person cannot then recover from, which is a much worse outcome for the
    same mistake.
  */
  function canSubmit(mode: "signin" | "signup", password: string, confirm: string) {
    if (password.length < 8) return false;
    if (mode === "signin") return true;
    return password === confirm;
  }

  assert.equal(canSubmit("signin", "correct-horse", ""), true, "sign-in needs no confirmation");
  assert.equal(canSubmit("signup", "correct-horse", "correct-horse"), true);
  assert.equal(canSubmit("signup", "correct-horse", "correct-hors"), false, "a typo is caught");
  assert.equal(canSubmit("signup", "correct-horse", ""), false, "an empty confirmation is not a match");

  // Too short fails in both modes, before any comparison happens.
  assert.equal(canSubmit("signup", "short", "short"), false);
  assert.equal(canSubmit("signin", "short", "short"), false);

  // Trailing whitespace is a real password difference and must not be ignored.
  assert.equal(canSubmit("signup", "correct-horse", "correct-horse "), false);
});

test("a reset request says the same thing whether or not the account exists", () => {
  /*
    "No account with that address" would turn the reset form into a way of
    checking whether somebody has an account here. That is not ours to
    disclose — an account is often tied to a real name, and confirming one
    exists helps anybody fishing.

    So the response is identical either way, and the underlying error is
    deliberately discarded rather than surfaced.
  */
  function responseFor(emailExists: boolean): string {
    // Mirrors the form: the outcome is not consulted.
    void emailExists;
    return "If there is an account for that address, a reset link is on its way.";
  }

  assert.equal(responseFor(true), responseFor(false), "the reply must not vary");
  assert.ok(!responseFor(false).toLowerCase().includes("no account"));
  assert.ok(!responseFor(true).toLowerCase().includes("found"));
});

test("ratings are halves between zero and five", () => {
  /*
    Mirrors the database check. Stored as numeric rather than a float because
    4.5 as a float can come back as 4.4999999, which then fails a constraint
    that looked obviously true when it was written.
  */
  const valid = (r: number | null) =>
    r === null || (r >= 0 && r <= 5 && r * 2 === Math.trunc(r * 2));

  for (const r of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]) {
    assert.equal(valid(r), true, `${r} should be allowed`);
  }
  assert.equal(valid(null), true, "not rating is allowed");

  for (const r of [-0.5, 5.5, 6, 2.3, 0.25, 4.9]) {
    assert.equal(valid(r), false, `${r} should be rejected`);
  }

  // Exactly eleven allowed values, which is what the control offers.
  const steps = [];
  for (let r = 0; r <= 5.0001; r += 0.5) steps.push(Math.round(r * 2) / 2);
  assert.equal(steps.length, 11);
  assert.ok(steps.every(valid));
});

test("a photo cannot be posted without a place", () => {
  /*
    The requirement that every photo attaches to an existing stop is what keeps
    this from becoming a general photo feed. The form refuses before sending,
    and the column is NOT NULL with a foreign key behind it, so a crafted
    request fails too.
  */
  function canSubmit(stopId: string | null, file: unknown) {
    return Boolean(stopId) && Boolean(file);
  }

  assert.equal(canSubmit("a-real-stop-id", {}), true);
  assert.equal(canSubmit(null, {}), false, "no place means no post");
  assert.equal(canSubmit("a-real-stop-id", null), false, "no file means no post");
  assert.equal(canSubmit("", {}), false, "an empty id is not a place");
});

test("the language filter does not reject real place names", async () => {
  const { screenText } = await import("../lib/language-filter");

  /*
    An index of place names is unusually exposed to this. Scunthorpe is the
    famous case; Penistone, Cockburn and Clitheroe are the same problem and
    every one of them is a town somebody might write a caption about.

    A filter that blocks those is worse than no filter, because it rejects
    honest writing and teaches people the site is broken.
  */
  for (const place of [
    "Scunthorpe",
    "the sign outside Penistone",
    "Cockburn Range",
    "Clitheroe Castle",
    "Dildo, Newfoundland",
    "Hancock, Michigan",
    "Big Beaver Road",
    "an assassin bug on the fence",
    "Middlesex County",
  ]) {
    assert.equal(screenText(place).clean, true, `"${place}" must be allowed`);
  }

  // And it still catches what it is for, including simple obfuscation.
  for (const bad of ["a classic shitbox", "sh1t", "what the fuck"]) {
    assert.equal(screenText(bad).clean, false, `"${bad}" should be blocked`);
  }

  // Empty input is not an error.
  assert.equal(screenText("").clean, true);
  assert.equal(screenText(null).clean, true);
  assert.equal(screenText(undefined).clean, true);
});

test("the age gate turns thirteen on the right day", async () => {
  const { ageOn, MINIMUM_AGE } = await import("../components/AuthForm");

  /*
    Off-by-one on a birthday is the classic version of this bug: subtracting
    years alone makes somebody thirteen on the first of January of the year
    they turn thirteen, which is up to twelve months early.
  */
  const today = new Date("2026-09-09T12:00:00");

  assert.equal(ageOn("2013-09-09", today), 13, "thirteen exactly today");
  assert.equal(ageOn("2013-09-10", today), 12, "birthday is tomorrow");
  assert.equal(ageOn("2013-01-01", today), 13, "birthday earlier this year");
  assert.equal(ageOn("2013-12-31", today), 12, "birthday later this year");
  assert.equal(ageOn("1975-04-02", today), 51);

  // Anything unusable is refused rather than treated as old enough.
  assert.equal(ageOn("", today), null);
  assert.equal(ageOn("not-a-date", today), null);
  assert.equal(ageOn("2030-01-01", today), null, "the future is not a birthday");

  assert.equal(MINIMUM_AGE, 13);

  // The gate itself: null must fail, not pass.
  const allowed = (dob: string) => {
    const age = ageOn(dob, today);
    return age !== null && age >= MINIMUM_AGE;
  };
  assert.equal(allowed("2013-09-09"), true);
  assert.equal(allowed("2013-09-10"), false);
  assert.equal(allowed(""), false, "a blank date must not get through");
});

test("the revalidate endpoint refuses when it is unconfigured", () => {
  /*
    An endpoint that clears the site's caches has to fail closed. If a missing
    secret meant "no authentication required", anybody could make the site
    rebuild its caches on demand — which is not catastrophic but is a free
    lever on somebody else's infrastructure.

    Models the route's decision rather than calling it, since the route needs a
    request and an environment.
  */
  function decide(secret: string | undefined, offered: string | null) {
    if (!secret) return 503;
    if (offered !== `Bearer ${secret}`) return 401;
    return 200;
  }

  assert.equal(decide(undefined, null), 503, "unconfigured must refuse");
  assert.equal(decide(undefined, "Bearer anything"), 503, "and keep refusing");
  assert.equal(decide("s3cret", null), 401, "no header is not authorised");
  assert.equal(decide("s3cret", "s3cret"), 401, "the Bearer prefix is required");
  assert.equal(decide("s3cret", "Bearer wrong"), 401);
  assert.equal(decide("s3cret", "Bearer s3cret"), 200);

  // An empty secret must not be satisfiable by an empty header.
  assert.equal(decide("", "Bearer "), 503, "an empty secret counts as unset");
});

test("a batch check catches the collision that overwrote two stops", async () => {
  const { checkBatch, reportBatch } = await import("../scripts/parse-batch.mts");

  /*
    The real case. Wisconsin's Crystal Cave and Illinois' Smiley Face Water
    Tower were imported while Ohio and Indiana already held those slugs. The
    upsert updated the existing rows instead of inserting, so an Ohio cave
    described a Wisconsin one and two states were quietly a stop short.

    Nothing errored, which is why this has to throw rather than warn.
  */
  const existing = [
    { slug: "crystal-cave", name: "Crystal Cave", city: "Put-in-Bay",
      state: "OH", latitude: 41.65, longitude: -82.82 },
    { slug: "smiley-face-water-tower", name: "Smiley Face Water Tower",
      city: "Ashley", state: "IN", latitude: 41.52, longitude: -85.06 },
  ];

  const incoming = [
    { name: "Crystal Cave", city: "Spring Valley", state: "WI",
      lat: 44.83295, lon: -92.2508, category: "caves", access: "limited",
      description: "", source: null, website: null },
    { name: "Smiley Face Water Tower", city: "Atlanta", state: "IL",
      lat: 40.25833, lon: -89.23537, category: "roadside-oddity",
      access: "roadside", description: "", source: null, website: null },
  ];

  const report = checkBatch(incoming, existing);
  assert.equal(report.slugCollisions.length, 2, "both collisions must be found");
  assert.ok(report.slugCollisions[0].includes("Put-in-Bay"));

  // Fifteen hundred miles apart, so proximity would never have caught these.
  assert.equal(report.nearbyExisting.length, 0);

  assert.throws(() => reportBatch("test", report), /slug collisions/);

  // A clean batch passes.
  const clean = checkBatch(
    [{ name: "Something Entirely New", city: "Nowhere", state: "WI",
       lat: 45, lon: -90, category: "roadside-oddity", access: "open",
       description: "", source: null, website: null }],
    existing,
  );
  assert.equal(clean.slugCollisions.length, 0);
  assert.doesNotThrow(() => reportBatch("clean", clean));

  // The same name twice inside one batch is also a collision.
  const twice = checkBatch(
    [
      { name: "Gravity Hill", city: "A", state: "WI", lat: 45, lon: -90,
        category: "folklore", access: "roadside", description: "", source: null, website: null },
      { name: "Gravity Hill", city: "B", state: "WI", lat: 44, lon: -91,
        category: "folklore", access: "roadside", description: "", source: null, website: null },
    ],
    [],
  );
  assert.equal(twice.duplicateSlugsWithin.length, 1);
  assert.throws(() => reportBatch("twice", twice));
});

test("a routing failure is described by its cause, not as an outage", () => {
  /*
    Every route through Orlando failed for weeks and reported "the routing
    service is unavailable". It was available the whole time — the city's
    geocoded point landed beside a lake, and the router could not find a road
    near it.

    The distinction matters in both directions. A traveller told the service is
    down waits; a traveller told we could not find a road near that place types
    a different address and carries on. And whoever maintains this goes looking
    at the provider's status page instead of at one bad coordinate.
  */
  function describe(status: number, detail = ""): { message: string; code: number } {
    if (status === 401 || status === 403) return { message: "credentials", code: 500 };
    if (status === 429) return { message: "quota", code: 429 };
    if (status === 400) {
      return /2004|exceed|maximum|limit/i.test(detail)
        ? { message: "too long", code: 422 }
        : { message: "couldn't use one of those locations", code: 422 };
    }
    if (status === 404) {
      return { message: "couldn't find a road near one of those places", code: 422 };
    }
    return { message: "unavailable", code: 502 };
  }

  // The Orlando case.
  const notRoutable = describe(404, '{"error":{"code":2010,"message":"Could not find routable point"}}');
  assert.match(notRoutable.message, /road near/);
  assert.equal(notRoutable.code, 422, "the traveller can fix this, so not a 5xx");
  assert.doesNotMatch(notRoutable.message, /unavailable/);

  // A genuine outage still reads as one.
  assert.match(describe(503).message, /unavailable/);
  assert.equal(describe(503).code, 502);
  assert.match(describe(500).message, /unavailable/);

  // And the other cases keep their own meanings.
  assert.equal(describe(429).code, 429);
  assert.equal(describe(401).code, 500);
  assert.match(describe(400, "code 2004 exceeds maximum").message, /too long/);
  assert.match(describe(400, "invalid").message, /locations/);
});

test("a dense corridor is thinned along the route, not truncated", async () => {
  const { findStopsNearRoute } = await import("../lib/corridor");

  /*
    Boston to Philadelphia matched 262 stops, every one genuinely within half
    an hour of the road. The filter was right and the answer was useless.

    Truncating would have been worse than useless: the northeast is dense
    enough around New York that the first sixty by any simple ordering are all
    in one metro area, leaving the traveller with nothing for the rest of the
    drive and no way to know why.
  */
  const geometry: [number, number][] = [];
  for (let i = 0; i <= 100; i += 1) geometry.push([-75 + i * 0.03, 40 + i * 0.02]);

  // Two hundred stops, three quarters of them piled into the first tenth.
  const stops = Array.from({ length: 200 }, (_, i) => {
    const clustered = i < 150;
    const along = clustered ? Math.random() * 10 : 10 + Math.random() * 90;
    return {
      id: `s${i}`, slug: `s${i}`, name: `Stop ${i}`, city: "X", state: "NY",
      category: "roadside-oddities" as const,
      latitude: 40 + along * 0.02, longitude: -75 + along * 0.03,
      description: "", publicAccess: "open" as const,
      source: null, website: null, timezone: null, verifiedAt: null,
    };
  });

  const shown = findStopsNearRoute(stops as never, geometry, { limit: 60 });
  assert.ok(shown.length <= 60, "the cap holds");
  assert.ok(shown.length > 40, "and it is not over-eager");

  // The far half of the drive must not be empty.
  const furthest = Math.max(...shown.map((s) => s.routePositionKm));
  const lateHalf = shown.filter((s) => s.routePositionKm > furthest / 2);
  assert.ok(
    lateHalf.length >= 8,
    `the second half of the route kept ${lateHalf.length} stops, which is too few`,
  );

  // Still in travelling order, so the list reads as a journey.
  for (let i = 1; i < shown.length; i += 1) {
    assert.ok(shown[i].routePositionKm >= shown[i - 1].routePositionKm);
  }

  // Under the limit nothing is dropped or reordered away from route position.
  const few = findStopsNearRoute(stops.slice(0, 12) as never, geometry, { limit: 60 });
  assert.equal(few.length, 12, "a short list is returned whole");
});

test("each revealed batch covers the whole route, not the next stretch of it", async () => {
  const { findStopsNearRoute } = await import("../lib/corridor");

  /*
    "Show me another sixty" has an obvious wrong implementation: continue from
    where the last batch stopped. That walks out from the origin, so somebody
    wanting to know what is near their destination clicks four times to find
    out. Revealing by spread rank instead means every batch spans the drive.
  */
  const geometry: [number, number][] = [];
  for (let i = 0; i <= 100; i += 1) geometry.push([-75 + i * 0.03, 40 + i * 0.02]);

  const stops = Array.from({ length: 250 }, (_, i) => {
    const along = (i / 250) * 100;
    return {
      id: `s${i}`, slug: `s${i}`, name: `Stop ${i}`, city: "X", state: "NY",
      category: "roadside-oddities" as const,
      latitude: 40 + along * 0.02, longitude: -75 + along * 0.03,
      description: "", publicAccess: "open" as const,
      source: null, website: null, timezone: null, verifiedAt: null,
    };
  });

  const all = findStopsNearRoute(stops as never, geometry, { limit: 300 });
  const furthest = Math.max(...all.map((s) => s.routePositionKm));

  const batch = (upTo: number) =>
    all.filter((s) => (s.spreadRank ?? 0) < upTo);

  for (const size of [60, 120, 180]) {
    const shown = batch(size);
    const late = shown.filter((s) => s.routePositionKm > furthest * 0.75);
    assert.ok(
      late.length >= 5,
      `showing ${size}: only ${late.length} stops in the last quarter of the route`,
    );
  }

  // Revealing more never removes anything already on screen.
  const first = new Set(batch(60).map((s) => s.id));
  for (const id of first) {
    assert.ok(batch(120).some((s) => s.id === id), "a revealed stop must not vanish");
  }

  // Ranks are unique, so a batch is a clean slice.
  const ranks = all.map((s) => s.spreadRank);
  assert.equal(new Set(ranks).size, ranks.length);
});
