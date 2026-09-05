import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How OddWay handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-hero">Privacy</h1>
      <div className="mt-8 max-w-[68ch] space-y-6 text-lede">
        <p>
          OddWay has no accounts, no analytics and no advertising trackers.
          Fonts are served from our own domain, so simply loading a page does
          not report anything to anyone else.
        </p>
        <p>
          <strong>Suggestions.</strong> If you send a suggestion or correction,
          we store what you wrote. If you choose to include an email address we
          store that too, and use it only to ask you a follow-up question about
          that suggestion. It is not added to any list and not shared. Leave the
          field blank and we have no way to identify you.
        </p>
        <p>
          <strong>Your location.</strong> When you use &ldquo;show me
          what&rsquo;s near me&rdquo;, your browser gives the page your
          coordinates and distances are worked out on your device. They are not
          sent to us and not stored.
        </p>
        <p>
          <strong>Route planning.</strong> Places you type into the route search
          are sent to OpenRouteService to be turned into coordinates and a
          route. Map tiles are served by OpenFreeMap. Neither receives an
          account or an identifier from us.
        </p>
        <p>
          A fuller policy will follow before launch. Until then this page
          describes everything the site actually does.
        </p>
      </div>
    </div>
  );
}
