import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { countStops } from "@/lib/stops";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Meet the Maker",
  description:
    "Something came down near Beach 6 at Presque Isle on the night of 31 July 1966. Most of it left. One of them did not, and has spent sixty years writing down everything strange he has found since.",
};

export default async function MeetTheMakerPage() {
  /*
    Counted, not written down. The last line of this story is the argument for
    the whole site, and it lands harder with a real number behind it — which
    also means the number must not be one somebody typed in and forgot.
  */
  const total = await countStops();

  return (
    <>
      <PageHero>
        <p className="text-[0.95rem] tracking-[0.14em] text-[#cfc9bb] uppercase">
          Meet Six
        </p>
        <h1 className="mt-4 max-w-[16ch] text-hero">The Story of Six</h1>
        <p className="mt-6 max-w-[56ch] text-lede text-[#cfc9bb]">
          On the night of 31 July 1966, something strange happened at Presque
          Isle State Park in Erie, Pennsylvania.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <figure className="mx-auto max-w-[520px]">
          <Image
            src="/images/six-beach-6.jpg"
            alt="Six standing on the sand beside the Beach 6 lifeguard tower at Presque Isle."
            width={900}
            height={1125}
            priority
            className="w-full rounded-[3px] border border-contour/45"
          />
          <figcaption className="mt-3 text-center text-[0.9rem] text-ink-soft">
            Six, back where he landed. Beach 6, Presque Isle State Park.
          </figcaption>
        </figure>

        <div className="article mx-auto mt-14 max-w-[62ch] space-y-6">
          <p className="text-lede">
            Visitors near Beach 6 reported an object descending from the sky and
            moving toward the woods. Police were called. The area was searched.
            Whatever had arrived that night seemed to disappear just as quickly.
          </p>

          <p>Almost.</p>

          <p>One of them never left. His name is Six.</p>

          <p>
            When the others returned to wherever they came from, Six was left
            behind at Beach 6 with no way home and an entire planet he knew
            absolutely nothing about.
          </p>

          <p>So he started walking.</p>

          <h2>What he found</h2>

          <p>
            At first he stayed close to Erie — the shoreline, the back roads,
            learning how people lived from a safe distance. The farther he went,
            the more one thing became obvious.
          </p>

          <p>This place was weird. Really weird.</p>

          <p>
            People told stories about creatures hiding in forests. Lights moving
            across empty skies. Buildings where footsteps carried on long after
            everybody had gone home. Monsters under lakes, abandoned towns,
            strange museums, giant roadside statues, unexplained landmarks — and
            places with stories nobody outside the county had ever heard.
          </p>

          <p>Six wanted to see all of it. So he did.</p>

          <p>
            Over sixty years he crossed the country looking for anything strange
            enough to be worth a detour. He followed Bigfoot reports into the
            woods. He visited towns built around their own monsters. He stood
            outside haunted buildings after dark, and went looking for lights in
            the sky that reminded him of the night he arrived.
          </p>

          <p>
            And he wrote all of it down. Every stop. Every story. Every strange
            little place he thought somebody else ought to see.
          </p>

          <h2>What it turned into</h2>

          <p>
            After decades of it, Six realised he had built something larger than
            a list of places. He had built a map of the weird side of America —
            a way for people to stop treating the space between one place and
            another as something to get through, and start treating it as the
            point.
          </p>

          <p>That became OddWay.</p>

          <p>
            He is still out there. Still travelling, still looking, still adding
            places whenever he finds one strange enough to make the list — all{" "}
            {total.toLocaleString()} of them so far.
          </p>

          <p>
            He may never have found his way home. After sixty years on the road
            he seems comfortable enough here, and he has a good many people to
            show around now.
          </p>

          <p className="text-lede">
            So next time you are heading somewhere, do not just take the fastest
            route. See what Six found along the way.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-[62ch]">
          <Link
            href="/#plan"
            className="inline-block rounded-[3px] bg-route px-6 py-3 font-semibold text-paper transition-colors hover:bg-[var(--color-route-hover)]"
          >
            Take the OddWay
          </Link>
        </div>
      </div>
    </>
  );
}
