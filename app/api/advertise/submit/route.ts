import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/** A banner is small. Anything larger than this is not a banner. */
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * An advertiser filling in what they bought.
 *
 * Runs with the service role, because the person posting has no account: the
 * bucket refuses writes from anyone but an administrator, and the advertisers
 * table refuses reads from anyone at all. The token is the authorisation, and
 * it is checked here rather than by a policy.
 *
 * It is consumed on success. A link that keeps working is a link that can be
 * forwarded, found in a shared inbox, or pulled out of a browser history in a
 * year — and it would let whoever has it change where the advertisement
 * points.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const token = String(form.get("token") ?? "");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  const { data: row } = await supabase
    .from("advertisers")
    .select("id, plan, submit_token_expires_at, submitted_at")
    .eq("submit_token", token)
    .maybeSingle();

  const expired =
    row?.submit_token_expires_at &&
    new Date(row.submit_token_expires_at as string) < new Date();

  if (!row || expired || row.submitted_at) {
    /*
      One message for three causes, as on the page itself. Telling somebody
      which of "unknown", "expired" and "already used" applies would confirm
      that a guessed token exists.
    */
    return NextResponse.json(
      { error: "That link is no longer valid. Write in and we will send another." },
      { status: 403 },
    );
  }

  const businessName = String(form.get("businessName") ?? "").trim();
  const destinationUrl = String(form.get("destinationUrl") ?? "").trim();

  if (!businessName) {
    return NextResponse.json({ error: "Add a business name." }, { status: 400 });
  }

  /*
    The destination is parsed rather than pattern-matched, and only http and
    https are allowed. A javascript: URL in an href that a visitor clicks is
    the oldest trick there is, and this field is filled in by somebody we have
    never met.
  */
  let url: URL;
  try {
    url = new URL(destinationUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
  } catch {
    return NextResponse.json(
      { error: "That web address does not look right. It should start https://" },
      { status: 400 },
    );
  }

  const banner = form.get("banner");
  if (!(banner instanceof File) || banner.size === 0) {
    return NextResponse.json({ error: "Add a banner image." }, { status: 400 });
  }
  if (banner.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is too large even after resizing. Try a smaller one." },
      { status: 400 },
    );
  }

  // The browser sends webp; anything else did not come from our form.
  if (banner.type !== "image/webp") {
    return NextResponse.json({ error: "Unsupported image format." }, { status: 400 });
  }

  const path = `${row.id}/${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("ad-banners")
    .upload(path, banner, { contentType: "image/webp", upsert: false });

  if (uploadError) {
    console.error("Banner upload failed:", uploadError.message);
    return NextResponse.json(
      { error: "The image would not upload. Try again." },
      { status: 502 },
    );
  }

  const latitude = numberOrNull(form.get("latitude"));
  const longitude = numberOrNull(form.get("longitude"));

  const { error: updateError } = await supabase
    .from("advertisers")
    .update({
      business_name: businessName,
      destination_url: url.toString(),
      description: String(form.get("description") ?? "").trim() || null,
      contact_name: String(form.get("contactName") ?? "").trim() || null,
      banner_path: path,
      location_name: String(form.get("locationName") ?? "").trim() || null,
      address: String(form.get("address") ?? "").trim() || null,
      latitude,
      longitude,
      submitted_at: new Date().toISOString(),
      // Spent. The row keeps its status, which is still pending.
      submit_token: null,
      submit_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateError) {
    console.error("Advertiser update failed:", updateError.message);
    return NextResponse.json({ error: "That did not save. Try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

/** Coordinates are optional, and a blank field is not a zero. */
function numberOrNull(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}
