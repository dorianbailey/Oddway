import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { PlanButton } from "@/components/PlanButton";
import { PLANS } from "@/lib/stripe";
import { countStops } from "@/lib/stops";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Advertise",
  description:
    "Put your business in front of travellers planning a detour. Two options, monthly, cancel any time.",
};

export default async function AdvertisePage() {
  const total = await countStops();

  return (
    <>
      <PageHero>
        <h1 className="max-w-[20ch] text-hero">Advertise on OddWay</h1>
        <p className="mt-6 max-w-[62ch] text-lede text-[#cfc9bb]">
          People come here having already decided to take the long way. They are
          looking at {total.toLocaleString()} places and working out which ones
          are worth the detour — which is a good moment to be a motel, a diner, a
          museum or a shop that sells strange things.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          {(["banner", "map"] as const).map((id) => {
            const plan = PLANS[id];
            return (
              <section
                key={id}
                className="flex flex-col rounded-[4px] border border-contour/45 bg-paper-raised p-6 sm:p-8"
              >
                <h2 className="text-section">{plan.name}</h2>
                <p className="mt-3 font-display text-[2rem] font-bold">
                  ${plan.monthly}
                  <span className="text-[1rem] font-normal text-ink-soft">
                    {" "}
                    a month
                  </span>
                </p>
                <p className="mt-4 max-w-[46ch] text-ink-soft">{plan.summary}</p>

                <ul className="mt-6 space-y-3">
                  {plan.includes.map((line) => (
                    <li key={line} className="border-l-2 border-contour pl-4">
                      {line}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 pt-2">
                  <PlanButton plan={id} label={`Advertise for $${plan.monthly}/month`} />
                </div>
              </section>
            );
          })}
        </div>

        {/*
          What happens next, before they pay rather than after.

          Stripe Checkout cannot take an image, so the banner is collected on a
          form afterwards — which means somebody pays before they have seen
          what they are filling in. Saying so here is the difference between
          that being a sensible order of operations and it being a surprise.
        */}
        <section className="mt-16 max-w-[68ch] border-t border-contour/40 pt-10">
          <h2 className="text-section">What happens after you pay</h2>
          <ol className="article mt-6 list-decimal space-y-3 pl-5">
            <li>
              Stripe takes the payment and we email you a link — usually within
              a minute.
            </li>
            <li>
              That link opens a short form: your business name, your website, a
              line of description, and your banner image. Nothing complicated,
              and you can do it from a phone.
            </li>
            <li>
              We look at it. Usually the same day. Nothing appears on the site
              until a person has checked it, which is also true of the
              photographs visitors post.
            </li>
            <li>It goes up, and you get an email saying so.</li>
          </ol>

          <h2 className="mt-12 text-section">The things worth saying plainly</h2>
          {/*
            The article class goes on the wrapper, not on each paragraph. Put
            on the paragraphs individually it styles them but gives them
            nothing to be spaced against, so four of them run together as a
            wall.
          */}
          <div className="article mt-6 space-y-6">
            <p>
              <strong>You cannot buy your way into the index.</strong> Not a
              stop, not an event, not a trip, not a featured artist. Advertising
              is advertising and it is labelled as such; the listings are
              written because somebody thought the place was interesting. That
              separation is the only reason either is worth anything.
            </p>
            <p>
              <strong>Cancel whenever you like</strong>, from the receipt Stripe
              sends you. Your advertisement runs to the end of the month you
              have paid for, and then stops. We do not pro-rate and we do not
              chase.
            </p>
            <p>
              <strong>We can decline.</strong> If a banner is misleading, or the
              business is not something we are willing to put in front of people
              driving to a roadside museum, we will refund you and say so.
            </p>
            <p>
              Questions first? Write in through the{" "}
              <Link href="/suggest?kind=other">suggestion box</Link> — it
              reaches a person, not a queue.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
