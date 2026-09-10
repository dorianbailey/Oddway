import type { Metadata } from "next";
import { ErrorPanel } from "@/components/ErrorPanel";

export const metadata: Metadata = {
  title: "Nothing here",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <ErrorPanel
      headline="Like a cryptid, this page cannot be found"
      body="Plenty of other things out there are easier to track down. There are over four thousand of them."
    />
  );
}
