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
  plan: "banner" | "map";
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
  plan: "banner" | "map";
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
  /*
    Banner-plan advertisers only. Map placement is a different product now
    rather than a tier above this one, and somebody who bought a marker did
    not buy a banner — showing one would be giving away the thing the other
    plan is for.
  */
  const ads = (await getActiveAds()).filter(
    (ad) => ad.plan === "banner" && ad.bannerPath,
  );
  if (ads.length === 0) return null;

  const day = Math.floor(Date.now() / 86_400_000);
  return ads[day % ads.length];
}

/** Sponsored places for the map. Empty until the map work lands. */
export async function getSponsoredPlaces(): Promise<ActiveAd[]> {
  return (await getActiveAds()).filter(
    (ad) =>
      ad.plan === "map" && ad.latitude !== null && ad.longitude !== null,
  );
}
