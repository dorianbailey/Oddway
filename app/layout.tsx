import type { Metadata, Viewport } from "next";
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
    "Have fun while you travel. Take the OddWay. Discover cryptids, folklore, haunted places, roadside oddities, strange history, museums, and unusual destinations along your road trip.",
  applicationName: "OddWay",
  openGraph: {
    title: "OddWay | Find Strange Stops Along Your Route",
    description:
      "Have fun while you travel. Take the OddWay. Discover cryptids, folklore, haunted places, roadside oddities, strange history, museums, and unusual destinations along your road trip.",
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
  themeColor: "#241d17",
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
        <UnitsProvider>
          <Header />

          {/*
            The sheet: content on paper, laid over the dark ground. The padding
            on this wrapper is what lets the room show around the edges.
          */}
          <div className="sheet-shadow grow sm:px-6 sm:py-8 lg:px-10 lg:py-12">
            <main id="main" className="sheet mx-auto max-w-[1400px]">
              {children}
            </main>
          </div>

          <Footer />
        </UnitsProvider>
      </body>
    </html>
  );
}
