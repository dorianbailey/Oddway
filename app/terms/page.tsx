import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for OddWay.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-hero">Terms</h1>
      <div className="mt-8 max-w-[68ch] space-y-6 text-lede">
        <p>
          OddWay is a preview. Listings, opening hours, access notes and detour
          estimates are provided for planning only and may be wrong or out of
          date. Check with the destination before you drive, and respect posted
          hours, private property and closures.
        </p>
        <p>Full terms of use will be published here before launch.</p>
      </div>
    </div>
  );
}
