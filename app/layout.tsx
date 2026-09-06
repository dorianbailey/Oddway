import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { UnitsProvider } from "@/components/UnitsProvider";
import { karla, sourceSerif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OddWay | Find Strange Stops Along Your Route",
    template: "%s | OddWay",
  },
  description:
    "Find the Strange. Take the OddWay. Discover cryptids, folklore, haunted places, roadside oddities, strange history, museums, and unusual destinations along your road trip.",
  applicationName: "OddWay",
  openGraph: {
    title: "OddWay | Find Strange Stops Along Your Route",
    description:
      "Find the Strange. Take the OddWay. Discover cryptids, folklore, haunted places, roadside oddities, strange history, museums, and unusual destinations along your road trip.",
    siteName: "OddWay",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OddWay | Find Strange Stops Along Your Route",
    description:
      "Discover cryptids, folklore, haunted places, roadside oddities, strange history, museums, and unusual destinations along your road trip.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050a0d",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${karla.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-[3px] focus:bg-paper focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        {/*
          The backdrop: woods at night, fixed behind everything so the sheet
          appears to lie on it. A fixed layer rather than
          background-attachment: fixed, which iOS ignores and which janks on
          scroll. Decorative, so it carries an empty alt.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
        >
          <Image
            src="/images/night-forest.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        <UnitsProvider>
          <Header />

          {/*
            The sheet: content on paper, laid over the dark ground. The padding
            on this wrapper is what lets the room show around the edges.
          */}
          {/*
            Generous margins so the board reads as a surface the paper is
            lying on, rather than as a hairline border round the page.
          */}
          <div className="sheet-shadow grow px-3 pt-4 pb-0 sm:px-10 sm:pt-12 lg:px-16 lg:pt-16">
            <main id="main" className="sheet mx-auto max-w-[1280px]">
              {children}
            </main>
          </div>

          <Footer />
        </UnitsProvider>
      </body>
    </html>
  );
}
