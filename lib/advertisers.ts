import { unstable_cache } from "next/cache";
import { getSupabase } from "./supabase";

/**
 * Advertising.
 *
 * Reads go through public.active_ads, a view holding only the columns that
 * appear on a page and only the rows that are live. The advertisers table
 * itself is closed to everyone but an administrator, because it carries a
 * contact email and Stripe identifiers and neither belongs on a public API.
 *
 * This replaces the markdown sponsor slots. Those were fine for a handful of
 * hand-placed spots and wrong for something somebody pays monthly for: a
 * campaign that ends needs to stop appearing without a deploy, and a banner is
 * an image that needs approving before it is on the site.
 */

export interface ActiveAd {
  id: string;
  businessName: string;
  destinationUrl: string;
  description: string | null;
  bannerPath: string | null;
  plan: "banner" | "banner_map";
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  logoPath: string | null;
}

interface AdRow {
  id: string;
  business_name: string;
  destination_url: string;
  description: string | null;
  banner_path: string | null;
  plan: "banner" | "banner_map";
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_path: string | null;
}

function toAd(row: AdRow): ActiveAd {
  return {
    id: row.id,
    businessName: row.business_name,
    destinationUrl: row.destination_url,
    description: row.description,
    bannerPath: row.banner_path,
    plan: row.plan,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    logoPath: row.logo_path,
  };
}

/** Public URL for a file in the banner bucket. */
export function bannerUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/ad-banners/${path}`;
}

/*
  Sixty seconds, not the five minutes stops get.

  An advertiser whose subscription lapses should come down promptly, and
  somebody who has just paid should go up promptly. Both are worth a shorter
  window than a museum's opening hours.
*/
const fetchActiveAds = unstable_cache(
  async (): Promise<ActiveAd[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("active_ads")
      .select(
        "id, business_name, destination_url, description, banner_path, plan, location_name, latitude, longitude, logo_path",
      );

    if (error || !data) {
      // An advertising failure must never take a page down with it.
      console.error("Supabase getActiveAds failed:", error?.message);
      return [];
    }
    return (data as AdRow[]).map(toAd);
  },
  ["ads:active"],
  { revalidate: 60, tags: ["ads"] },
);

export async function getActiveAds(): Promise<ActiveAd[]> {
  return fetchActiveAds();
}

/**
 * One banner to show, or nothing.
 *
 * Rotated by the day of the year rather than at random, so a page does not
 * show a different advertiser every time it is refreshed — which looks broken,
 * and would make a screenshot impossible for an advertiser to take.
 *
 * With one advertiser this is simply that advertiser. It becomes a rotation
 * only when there is something to rotate.
 */
export async function getBanner(): Promise<ActiveAd | null> {
  const ads = await getActiveAds();
  if (ads.length === 0) return null;

  const day = Math.floor(Date.now() / 86_400_000);
  return ads[day % ads.length];
}

/**
 * How many banner slots are spoken for.
 *
 * Counts pending as well as active, because somebody who has paid and not yet
 * filled in the form is holding a slot — they have the receipt. Counting only
 * the live ones would let a fourth banner be sold while a third was in the
 * post, and the fix for that is a refund and an apology.
 *
 * The cost is that an abandoned signup blocks a sale until somebody clears it.
 * The review screen shows which pending rows are holding slots, which makes
 * that a two-minute job rather than a mystery.
 *
 * Read with the service role: the public view deliberately hides pending rows,
 * and a count that cannot see them would be the wrong count.
 */
export async function countBannersTaken(): Promise<number> {
  const { getAdminSupabase } = await import("./supabase-admin");

  try {
    const { count, error } = await getAdminSupabase()
      .from("advertisers")
      .select("id", { count: "exact", head: true })
      .eq("plan", "banner")
      .in("status", ["active", "pending"]);

    if (error) throw new Error(error.message);
    return count ?? 0;
  } catch (caught) {
    /*
      Fail closed. If the count cannot be read, report the slots as full rather
      than as free — refusing a sale is recoverable and overselling is not.
    */
    console.error("countBannersTaken failed:", caught);
    return Number.MAX_SAFE_INTEGER;
  }
}

/** Sponsored places for the map. Empty until the map work lands. */
export async function getSponsoredPlaces(): Promise<ActiveAd[]> {
  return (await getActiveAds()).filter(
    (ad) =>
      ad.plan === "banner_map" &&
      ad.latitude !== null &&
      ad.longitude !== null,
  );
}
