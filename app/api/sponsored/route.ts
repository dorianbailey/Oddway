import { NextResponse } from "next/server";
import { getSponsoredPlaces } from "@/lib/advertisers";

/**
 * Paid map placements, for the map to fetch.
 *
 * Mirrors /api/pins, and exists for the same reason that one does: the map is
 * a client component, and the alternative was making the server components
 * above it async — which is not allowed inside a client boundary and broke
 * every page with a map on it when tried.
 *
 * Only the fields that appear in a marker. The active_ads view has already
 * dropped the contact email and the Stripe identifiers, and this narrows it
 * further: a public endpoint should carry what it needs and nothing more.
 */
export const revalidate = 60;

export async function GET() {
  const places = (await getSponsoredPlaces()).map((ad) => ({
    id: ad.id,
    businessName: ad.businessName,
    destinationUrl: ad.destinationUrl,
    description: ad.description,
    locationName: ad.locationName,
    latitude: ad.latitude,
    longitude: ad.longitude,
  }));

  return NextResponse.json(
    { places },
    {
      headers: {
        /*
          A minute fresh, an hour stale. Shorter than the pins endpoint: a
          lapsed subscription should stop showing promptly, and somebody who
          has just been approved should appear promptly. Neither is worth a
          database read per visitor.
        */
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
      },
    },
  );
}
