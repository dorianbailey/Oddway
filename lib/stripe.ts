import Stripe from "stripe";

/**
 * Stripe, and the two things we sell.
 *
 * The plans live here rather than in the database because they are not data —
 * they are a decision, and a price that can be edited without a deploy is a
 * price that can be edited by accident. Adding a third plan later means adding
 * an entry here and an environment variable, which is the amount of ceremony a
 * new price deserves.
 */

export type PlanId = "banner" | "map";

/**
 * How many banners run at once.
 *
 * Three, because the slot rotates by day and a fourth advertiser would show
 * only three days in four — which is not what "your banner on the homepage"
 * says. Selling a share of a rotation nobody was told about is the kind of
 * thing that produces refunds and bad reviews in that order.
 *
 * Map placements are not capped. A marker does not compete for a position: two
 * sponsors in different states are both simply there, and a hundred of them
 * would still each be exactly where they paid to be.
 */
export const BANNER_SLOTS = 3;

export interface Plan {
  id: PlanId;
  name: string;
  /** Dollars a month, for display. Stripe holds the authoritative price. */
  monthly: number;
  summary: string;
  includes: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  banner: {
    id: "banner",
    name: "Banner Advertising",
    monthly: 59,
    summary:
      "A clickable banner shown across the site, to people who are already planning a drive.",
    includes: [
      "Your banner on the homepage and on stop pages",
      "A link straight to your own site",
      "A short line of text beside it",
      "Cancel any time; it runs to the end of the month you paid for",
    ],
  },
  map: {
    id: "map",
    name: "Featured Map Placement",
    monthly: 79,
    summary:
      "Your business marked on the OddWay map, where people are working out what is near their route.",
    includes: [
      "A marker on the map, distinct from ordinary listings",
      "Your name, logo and a description when somebody taps it",
      "A link straight to your own site",
      "Cancel any time; it runs to the end of the month you paid for",
    ],
  },
};

/** Which Stripe price a plan buys. Ids are configuration, not code. */
export function priceIdFor(plan: PlanId): string | null {
  const id =
    plan === "banner"
      ? process.env.STRIPE_PRICE_BANNER
      : process.env.STRIPE_PRICE_MAP;
  return id && id.startsWith("price_") ? id : null;
}

/** Work back from a Stripe price to a plan, for the webhook. */
export function planForPrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_BANNER) return "banner";
  if (priceId === process.env.STRIPE_PRICE_MAP) return "map";
  return null;
}

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (typeof window !== "undefined") {
    throw new Error("getStripe() was called in the browser.");
  }
  if (stripe) return stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");

  /*
    No apiVersion pinned. The installed SDK defaults to the version it was
    built against, which is the one its types describe — pinning a different
    string here is how you get responses the types say cannot happen.
  */
  stripe = new Stripe(key);
  return stripe;
}

/** Where somebody lands after paying, and after backing out. */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://taketheoddway.com"
  );
}
