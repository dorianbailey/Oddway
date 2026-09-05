import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "OddWay is a road-trip planner for people who would rather see the strange thing than make good time.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero>
          <h1 className="max-w-[18ch] text-hero">
            The interesting part is rarely on the interstate
          </h1>
        </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-[68ch] space-y-6 text-lede">
          <p>
            OddWay is a road-trip planner for people who would rather see the
            strange thing than make good time. You give it a start and a finish;
            it gives you back the museum in a converted storefront, the monument
            the fire department built, the hill where the car rolls uphill.
          </p>
          <p>
            The point is not to be spooky about it. Most of these places are run
            by one enthusiastic person and a donation box, and the reason they
            are worth the detour is that somebody cared enough to keep them
            going. We list what a stop actually is, how far off your route it
            sits, and whether you can get inside.
          </p>
          <p>
            The index is built by hand, entry by entry, with sources recorded
            for each one. It starts in Appalachia because that is where the
            density is highest, and it works outward from there.
          </p>
        </div>

        <h2 className="mt-16 text-section">Where this is up to</h2>
        <div className="mt-6 max-w-[68ch] space-y-6">
          <p>
            OddWay is early. The route search and the interactive map are the
            next things to land, and until they do, the homepage shows a worked
            example rather than live results. Nothing on the site is a
            simulation of a feature that does not exist.
          </p>
          <p>
            In the meantime you can{" "}
            <Link
              href="/explore"
              className="font-semibold text-route underline underline-offset-4"
            >
              browse the index
            </Link>{" "}
            by category.
          </p>
        </div>
      </div>
    </>
  );
}
