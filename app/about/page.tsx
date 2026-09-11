import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { countAggregatorSourced, countStops } from "@/lib/stops";
import { getTrips } from "@/lib/trips";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "OddWay is a road-trip planner for people who would rather see the strange thing than make good time.",
};

export default async function AboutPage() {
  /*
    Counted rather than written down. The previous version of this page said
    coverage "starts in Appalachia and works outward", and that the route
    search and map "are the next things to land" — both true when written and
    long out of date by the time anybody noticed. A number that reads itself
    from the index cannot go stale.

    The unverified count used to sit here and made exactly that mistake in the
    other direction: it was honest at 25, then an import forgot to set a column
    and it read 1,120 for a day, claiming of a thousand freshly researched
    stops that we could not verify them. It is now zero, which says nothing.
    What is still true, and still worth admitting, is how many entries rest on
    a rival guide because nobody else ever wrote the place up.

    The state count is written out rather than counted. countStates() reads
    distinct values from the state column, and the District of Columbia is one
    of them, so this page said "51 states" from the moment DC went in. The map
    is finished and cannot grow past fifty-one, so a live number here buys
    nothing and only risks saying something untrue again.
  */
  const [total, guideOnly] = await Promise.all([
    countStops(),
    countAggregatorSourced(),
  ]);

  /*
    Counted for the same reason as everything else here. This paragraph said
    "Fifteen road trips" and there were seventeen files, two of which are
    walks rather than drives.
  */
  const trips = getTrips();
  const drives = trips.filter((t) => !t.onFoot).length;
  const walks = trips.filter((t) => t.onFoot).length;

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">
          The interesting part is rarely on the interstate
        </h1>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="article max-w-[68ch]">
          <p className="text-lede">
            OddWay is a road-trip planner for people who would rather see the
            strange thing than make good time. You give it a start and a finish;
            it gives you back the museum in a converted storefront, the monument
            the fire department built, the hill where the car rolls uphill.
          </p>
          <p>
            The point is not to be spooky about it. Most of these places are run
            by one enthusiastic person and a donation box, and the reason they
            are worth the detour is that somebody cared enough to keep them
            going. We say what a stop actually is, how far off your route it
            sits, and whether you can get inside.
          </p>

          <h2>Where this is up to</h2>
          <p>
            {total.toLocaleString()} places across every state and the
            District of Columbia, every one with a description, and route
            search and the map both working. Type two towns into{" "}
            <Link href="/#plan">plan a trip</Link> and you get what is actually
            on the way.
          </p>
          <p>
            Coverage is uneven and always will be. The northeast is dense
            because that is where the work started; long drives through the
            middle of the country are thin, and when a route comes back empty
            the site says so rather than pretending otherwise.
          </p>

          <h2>How the index is built</h2>
          <p>
            By hand, entry by entry. Roughly three hundred stops began as a scan
            of OpenStreetMap and have since been rewritten one at a time; every
            entry after that was researched a state at a time, because a keyword
            search finds things whose names contain the keyword and misses the
            Albatwitch at Chickies Rock entirely.
          </p>
          <p>
            Every entry cites where its facts came from. Where that source is a
            rival travel guide we credit it by name without linking, so you can
            check it without us handing them the click — and for{" "}
            <strong>
              {guideOnly.toLocaleString()} entries that guide is the only thing
              anybody has ever written about the place.
            </strong>{" "}
            That is worth saying out loud: a citation is not the same as
            standing there, and the{" "}
            <Link href="/suggest?kind=correction">suggestion box</Link> exists
            because somebody standing outside a museum that shut two years ago
            knows something the index does not.
          </p>
          <p>
            Access states do real work. Whether a place is open, ticketed,
            seasonal, on private land, or reachable only by a mile of unmarked
            trail is the difference between a good afternoon and a wasted one,
            and in a few cases between a good afternoon and a dangerous one.
          </p>

          <h2>What else is here</h2>
          <p>
            <Link href="/trips#driving">{drives} road trips</Link>, written as
            routes rather than lists, and{" "}
            <Link href="/trips#on-foot">{walks} walking trips</Link> through
            towns where everything is on one street.{" "}
            <Link href="/stories">Case studies</Link> on why every state has a
            gravity hill, what happens to a museum built by one person, and how
            two towns eight miles apart both hold a world&rsquo;s largest
            basket record.
          </p>
          <p>
            <Link href="/artists">A featured artist every week</Link>, with
            links straight to their shop. We take nothing and have no
            arrangement with anyone listed.
          </p>
          {/*
            Said once, plainly, on the page that makes the claim the rest of
            the site rests on. A reader who sees an advert next to a stop will
            wonder whether the stop was bought, and the answer needs to be
            somewhere they can find it.
          */}
          <p>
            Some slots on the site are paid for and say{" "}
            <strong>Sponsor</strong> on them.{" "}
            <strong>
              Nothing in the index is there because somebody paid.
            </strong>{" "}
            Not a stop, not an event, not a trip, not an artist. If that ever
            changes it will be said here first.
          </p>
          <p>
            And <Link href="/photos">photographs from people who went</Link>.
          </p>
          {/*
            This said an account was needed to post a photo "and for nothing
            else", which was true until the bucket list arrived. A sentence
            that quietly stops being true is the thing this page keeps getting
            wrong, so it now names both and nothing more.
          */}
          <p>
            An account does two things and no others: it lets you post a photo,
            and it keeps a <Link href="/account">bucket list</Link> of places
            you mean to get to. The list is private — there is no sharing, no
            public view, and nobody else can see it. Everything else here works
            signed out.
          </p>
        </div>
      </div>
    </>
  );
}
