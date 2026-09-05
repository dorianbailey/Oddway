import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { UnitsProvider } from "@/components/UnitsProvider";
import { bitter, karla } from "./fonts";
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
  themeColor: "#26382d",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bitter.variable} ${karla.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-[3px] focus:bg-paper focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <UnitsProvider>
          <Header />
          <main id="main" className="grow">
            {children}
          </main>
          <Footer />
        </UnitsProvider>
      </body>
    </html>
  );
}
