import { getServerSupabase } from "./supabase-server";
import { bannerUrl } from "./advertisers";

/**
 * Every advertiser, for the review screen.
 *
 * Read with the administrator's own session rather than the service role. The
 * policy on the table already says administrators and nobody else, so using
 * the session means this page cannot see anything the policy would not allow —
 * and a mistake here is bounded by the same rule that bounds everything else.
 *
 * The service role is reserved for the two callers that genuinely have no
 * session to check: the Stripe webhook, and an advertiser filling in a form
 * with nothing but a token.
 */

export interface AdvertiserRow {
  id: string;
  businessName: string;
  destinationUrl: string;
  description: string | null;
  bannerUrl: string | null;
  bannerPath: string | null;
  contactName: string | null;
  contactEmail: string;
  plan: "banner" | "map";
  status: "pending" | "active" | "paused" | "cancelled";
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Paid through. Null when invoiced by hand rather than through Stripe. */
  paidThrough: string | null;
  hasSubscription: boolean;
  submitted: boolean;
  /** Still holding an unspent setup link. */
  awaitingSetup: boolean;
  createdAt: string;
}

export async function getAdvertisers(): Promise<AdvertiserRow[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("advertisers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getAdvertisers failed:", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    businessName: row.business_name as string,
    destinationUrl: (row.destination_url as string) ?? "",
    description: (row.description as string) ?? null,
    bannerUrl: bannerUrl((row.banner_path as string) ?? null),
    bannerPath: (row.banner_path as string) ?? null,
    contactName: (row.contact_name as string) ?? null,
    contactEmail: row.contact_email as string,
    plan: row.plan as "banner" | "map",
    status: row.status as "pending" | "active" | "paused" | "cancelled",
    locationName: (row.location_name as string) ?? null,
    address: (row.address as string) ?? null,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    paidThrough: (row.current_period_end as string) ?? null,
    hasSubscription: Boolean(row.stripe_subscription_id),
    submitted: Boolean(row.submitted_at),
    awaitingSetup: Boolean(row.submit_token),
    createdAt: row.created_at as string,
  }));
}
