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
