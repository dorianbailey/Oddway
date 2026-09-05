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
          OddWay is in development and is not yet collecting personal data.
          There are no accounts, no analytics, no advertising trackers, and no
          third-party embeds on this site. Fonts are served from our own domain,
          so loading a page does not report anything to anyone else.
        </p>
        <p>
          A full privacy policy will be published here before any feature that
          stores or transmits your information goes live, and it will say
          plainly what is collected and why.
        </p>
      </div>
    </div>
  );
}
