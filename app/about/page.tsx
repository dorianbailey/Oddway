import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { countStates, countStops, countUnverified } from "@/lib/stops";

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
  */
  const [total, states, unverified] = await Promise.all([
    countStops(),
    countStates(),
    countUnverified(),
  ]);

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
            {total.toLocaleString()} places across {states} states, every
            one with a description, and route search and the map both working.
            Type two towns into{" "}
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
            By hand, entry by entry. Roughly three hundred stops came from a
            scan of OpenStreetMap; everything since has been researched a state
            at a time, because a keyword search finds things whose names contain
            the keyword and misses the Albatwitch at Chickies Rock entirely.
          </p>
          <p>
            Every entry cites where its facts came from. Where that source is a
            rival travel guide we credit it by name without linking, so you can
            check it without us handing them the click.{" "}
            <strong>
              {unverified} entries say plainly that we could not verify them.
            </strong>{" "}
            That is deliberate: an honest gap is worth more than a confident
            guess, and the{" "}
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
            <Link href="/trips">Fifteen road trips</Link>, written as routes
            rather than lists.{" "}
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
          <p>
            And <Link href="/photos">photographs from people who went</Link>.
            An account is needed to post one and for nothing else.
          </p>
        </div>
      </div>
    </>
  );
}
