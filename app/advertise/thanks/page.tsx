import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Thanks",
  robots: { index: false, follow: false },
};

/**
 * Where Stripe sends somebody after they pay.
 *
 * Deliberately says nothing about their subscription beyond thanking them.
 *
 * This page is reachable by anybody who guesses the URL, and the session id in
 * the query string is not proof of anything — looking it up and printing an
 * email address or a plan here would mean a stranger with a copied link could
 * read them. The authoritative record is the webhook's, and the confirmation
 * the advertiser can trust is the email Stripe sends and the one we send.
 */
export default function ThanksPage() {
  return (
    <>
      <PageHero>
        <h1 className="max-w-[20ch] text-hero">Thank you</h1>
        <p className="mt-6 max-w-[58ch] text-lede text-[#cfc9bb]">
          That went through. Check your email — there is a link in it to set up
          what we should show.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="article max-w-[62ch]">
          <p className="text-lede">
            The email should arrive within a minute or two. It contains a link
            to a short form — your business name, your website, a line of
            description, and your banner.
          </p>
          <p>
            <strong>If it does not arrive,</strong> look in spam first, and then
            write in through the{" "}
            <Link href="/suggest?kind=other">suggestion box</Link> with the
            email address you paid with. We can send another link. Nothing is
            lost and you are not charged twice.
          </p>
          <p>
            Once you have filled the form in, we look at it — usually the same
            day — and you will get an email when it is live.
          </p>
          <p>
            Stripe has emailed you a receipt, and you can cancel from that at
            any time.
          </p>
        </div>
      </div>
    </>
  );
}
