import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What OddWay collects, why, and how to get rid of it.",
};

/*
  This page said "OddWay has no accounts, no analytics and no advertising
  trackers" for a while after accounts, photo uploads, avatars and bios were
  added. A stale privacy page is the worst kind to have: it is the one page a
  reader is entitled to treat as a statement of fact.

  Written as a description of what the code does rather than as a policy, so
  anybody comparing the two can check.
*/
export default function PrivacyPage() {
  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">Privacy</h1>
        <p className="mt-6 max-w-[58ch] text-lede text-[#cfc9bb]">
          What we collect, why, and how to get rid of it. Most of the site works
          without giving us anything at all.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="article max-w-[68ch]">
          <p className="text-lede">
            Browsing OddWay needs no account. There are no tracking pixels and
            no analytics service watching you read. Fonts and images are served
            from our own domain, so loading a page does not report anything to
            a third party.
          </p>

          <h2>Advertising</h2>
          <p>
            Some slots on the site are paid for. They are labelled{" "}
            <strong>Advertisement</strong> and they are not an ad network: there is no
            third-party script, no cookie, no pixel and no page view reported to
            anybody. A sponsor slot is a name, a sentence and a link, written
            into the site the same way a trip is.
          </p>
          <p>
            That means an advertiser learns nothing about you unless you click
            their advert, at which point you are on their website and their
            privacy policy applies rather than ours. We do not tell them who
            clicked, because we do not know.
          </p>
          <p>
            Advertisers pay through Stripe and give us a business name, a
            website, a description and an image. If you are the advertiser
            rather than the reader, that is the data we hold about you, and you
            can have it removed by asking.
          </p>
          <p>
            If OddWay ever moves to a real advertising network this page will
            change first, and say so plainly, because that would be a different
            arrangement entirely.
          </p>

          <h2>If you make an account</h2>
          {/*
            This said an account existed for one reason. The bucket list made
            that two, and a privacy page that undercounts what it holds is the
            worst page on the site to be wrong on.
          */}
          <p>
            An account does two things: it lets you post photos of places you
            have been, and it keeps a bucket list of places you mean to get to.
            Nothing else on the site requires one.
          </p>
          <p>We store:</p>
          <ul>
            <li>
              <strong>Your email address</strong>, so you can sign in and reset
              your password. It is not shown to anyone and not added to any
              mailing list.
            </li>
            <li>
              <strong>Your password</strong>, hashed by our authentication
              provider. We never see it and cannot recover it.
            </li>
            <li>
              <strong>A display name</strong>, which is public and appears next
              to your photos. It is set once and cannot be changed afterwards,
              so pick something you are content to be credited as.
            </li>
            <li>
              <strong>A bio and a profile picture</strong>, if you add them.
              Both are public.
            </li>
            <li>
              <strong>Your bucket list</strong> — which stops you have saved,
              and when. This is private. There is no sharing, no public view and
              no count shown anywhere; the database will not return another
              account&rsquo;s list even if asked.
            </li>
          </ul>

          <h2>Photos you upload</h2>
          <p>
            Photos are public, credited to your display name, and shown on the
            page of the place they were taken as well as in the gallery.
          </p>
          <p>
            <strong>
              Location and camera data are stripped before the file leaves your
              device.
            </strong>{" "}
            A photo from a phone normally carries the exact coordinates it was
            taken at, the time, and often a device identifier. We remove all of
            it in your browser by redrawing the image, so none of it ever
            reaches our servers. The photo is also resized, which is why it
            uploads faster than you might expect.
          </p>
          <p>
            You can delete your own photos at any time. We can also remove a
            photo or block an account, which hides everything that account has
            posted.
          </p>

          <h2>Suggestions</h2>
          <p>
            If you send a correction or suggest a place, we store what you
            wrote. Including an email address is optional and it is used only to
            ask a follow-up question about that suggestion. Suggestions are
            never published and cannot be read by anyone but us.
          </p>

          <h2>Your location</h2>
          <p>
            When you ask for what is near you, your browser hands the page your
            coordinates and the distances are worked out on your device. They
            are not sent to us and not stored.
          </p>

          <h2>Route planning</h2>
          <p>
            Places you type into the route search are sent to OpenRouteService
            to be turned into coordinates and a route. Map tiles come from
            OpenFreeMap. Neither receives an account or an identifier from us,
            but both see the request, which means they see the places you asked
            about.
          </p>

          <h2>Who else handles it</h2>
          <p>
            We do not run our own servers. These companies process data on our
            behalf, all of them in the United States:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — the database, sign-in and photo
              storage.
            </li>
            <li>
              <strong>Vercel</strong> — hosting. Serves the pages and keeps
              short-lived request logs.
            </li>
            <li>
              <strong>Resend</strong> — sends us an email when a suggestion
              arrives, and sends advertisers the link they need after paying.
            </li>
            <li>
              <strong>Stripe</strong> — takes payment for advertising, and only
              for that. Card details are entered on Stripe&rsquo;s own pages and
              never touch ours; we hold an email address, a customer reference
              and a subscription reference, which is what tells us whether an
              advertisement is still paid for. Nobody browsing the site is sent
              to Stripe or known to them.
            </li>
            <li>
              <strong>OpenRouteService and OpenFreeMap</strong> — routing and
              map tiles, as above.
            </li>
          </ul>
          <p>
            We do not sell data to anyone, and there is nothing here worth
            selling.
          </p>

          <h2>Getting rid of it</h2>
          <p>You can delete any photo you have posted from your account page.</p>
          <p>
            You can also delete the whole account, from the bottom of the same
            page. That removes your profile, your bucket list, every photo you
            have posted and the image files themselves. It asks once to be sure
            and then does it immediately — no email, no waiting on us, and no
            undo.
          </p>
          <p>
            If something goes wrong partway through, the page says so and
            nothing is deleted. Write in through the{" "}
            <Link href="/suggest?kind=other">suggestion box</Link> if that
            happens.
          </p>

          <h2>Children</h2>
          <p>
            Accounts are for people aged 13 and over. Signing up asks for your
            date of birth to check that.
          </p>
          <p>
            <strong>We do not store it.</strong> The date is checked in your
            browser and discarded — keeping a database of children&rsquo;s
            birthdays in order to keep children out would be a strange way to
            protect them.
          </p>
          <p>Browsing needs no account and no age.</p>

          <p>
            This page describes what the site actually does. If you find
            something here that does not match how OddWay behaves, that is a bug
            and we would like to know about it.
          </p>
        </div>
      </div>
    </>
  );
}
