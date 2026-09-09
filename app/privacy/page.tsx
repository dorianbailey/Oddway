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
            Browsing OddWay needs no account. There is no advertising, no
            tracking pixels and no analytics service watching you read. Fonts
            and images are served from our own domain, so loading a page does
            not report anything to a third party.
          </p>

          <h2>If you make an account</h2>
          <p>
            An account exists for one reason: adding photos of places you have
            been. Nothing else on the site requires one.
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
              arrives.
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
            Deleting the account itself is not yet a button, which is a gap
            rather than a policy. Ask through the{" "}
            <Link href="/suggest?kind=other">suggestion box</Link> and we will
            remove the account, its photos and its files. Say so plainly and it
            will be done rather than negotiated.
          </p>

          <h2>Children</h2>
          <p>
            Accounts are for people aged 13 and over. Browsing needs no account
            and no age.
          </p>

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
