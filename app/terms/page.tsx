import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Terms",
  description: "What OddWay promises, what it does not, and the rules for posting.",
};

/*
  Rewritten when photo uploads landed. The previous version said full terms
  would follow before launch, which was fine for a site nobody could post to
  and not fine for one where visitors publish photographs.

  Written in plain language on purpose. Terms nobody reads protect nobody, and
  the rules here are short enough to actually read.
*/
export default function TermsPage() {
  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">Terms</h1>
        <p className="mt-6 max-w-[58ch] text-lede text-[#cfc9bb]">
          What we promise, what we do not, and the rules for posting. Short on
          purpose.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="article max-w-[68ch]">
          <h2>Check before you drive</h2>
          <p className="text-lede">
            Listings, opening hours, access notes, ratings and detour estimates
            are for planning and may be wrong or out of date. Small places close
            without telling anyone, roads shut, and seasonal sites keep their
            own calendars.
          </p>
          <p>
            Where an entry says it is on private land, or that a trail is closed,
            or that access is by arrangement, take that seriously. Around 24
            entries in the index say plainly that we could not verify them.
            Nothing here is permission to go anywhere.
          </p>

          <h2>Posting photos</h2>
          <p>By uploading a photo you confirm that:</p>
          <ul>
            <li>
              <strong>You took it, or you have the right to publish it.</strong>{" "}
              Not a photo you found online, and not somebody else&rsquo;s work.
            </li>
            <li>
              <strong>You give us permission to show it on OddWay</strong>,
              credited to your display name, on the page of the place it
              belongs to and in the gallery. You keep the copyright and can
              delete it whenever you like.
            </li>
            <li>
              <strong>Anyone identifiable in it is content to be published.</strong>{" "}
              A crowd in a public place is fine; a photograph of a stranger&rsquo;s
              face as the subject is not.
            </li>
            <li>
              <strong>It is a photograph of the place it is attached to.</strong>{" "}
              That is the whole point of requiring one.
            </li>
          </ul>

          <h2>What we will remove</h2>
          <p>
            Anything illegal. Anything sexual. Anything abusive, hateful, or
            aimed at a person. Spam and advertising. Photographs of somewhere
            other than the place claimed. Content posted to identify, follow or
            harass somebody.
          </p>
          <p>
            A first-time poster&rsquo;s photograph is checked before it appears.
            After that they go up straight away, and we remove what needs
            removing afterwards. We can hide a photo, delete it, or block an
            account — which hides everything that account has ever posted.
          </p>
          <p>
            We do not have to explain a removal, and we would rather remove
            something and discuss it than leave it up while we decide.
          </p>

          <h2>Accounts</h2>
          <p>
            Aged 13 and over. One person per account. Do not use somebody
            else&rsquo;s name, and do not pick a display name meant to
            impersonate a person or a place — it cannot be changed later, which
            is a good reason to think about it once.
          </p>

          <h2>If something here is yours</h2>
          <p>
            If a photograph on OddWay is your work and was posted by somebody
            else, or an entry about a place you own or run is wrong, tell us
            through the{" "}
            <Link href="/suggest?kind=correction">suggestion box</Link> and it
            will be taken down or corrected. You do not need a lawyer to ask.
          </p>

          <h2>No warranty</h2>
          <p>
            OddWay is provided as it is, with no guarantee that it is accurate,
            complete or available. Several places in the index are remote,
            unmaintained, or genuinely dangerous — abandoned mines, desert roads
            with no phone signal, cliffs. You are responsible for your own
            safety and for deciding whether to go.
          </p>

          <h2>Changes</h2>
          <p>
            These terms will change as the site does. When they change
            materially we will say so rather than editing quietly, because a
            page like this is only worth anything if you can trust what it said
            last time you read it.
          </p>
        </div>
      </div>
    </>
  );
}
