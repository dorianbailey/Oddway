import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { AdvertiserSubmitForm } from "@/components/AdvertiserSubmitForm";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your advertisement",
  robots: { index: false, follow: false },
};

interface SubmitPageProps {
  params: Promise<{ token: string }>;
}

/**
 * Where an advertiser fills in what we should show.
 *
 * The token in the URL is the whole of the authentication. There is no
 * account: somebody has paid fifty-nine dollars and making them create a login
 * to spend it would be a second obstacle after the one they just cleared.
 *
 * So the lookup happens here, on the server, with the service role. The
 * browser is never given a key that could read this row — a policy saying
 * "anyone holding a token may read" would put the whole table one guessed
 * string away from being readable, and the guess would be free to attempt.
 *
 * Three ways this page says no, and they are deliberately indistinguishable
 * from each other in what they tell the visitor: an unknown token, an expired
 * one, and one already used. Distinguishing them would confirm to somebody
 * guessing that a particular string exists.
 */
export default async function SubmitPage({ params }: SubmitPageProps) {
  const { token } = await params;

  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("advertisers")
    .select(
      "id, business_name, destination_url, description, contact_name, plan, status, submit_token_expires_at, submitted_at, location_name, address, latitude, longitude",
    )
    .eq("submit_token", token)
    .maybeSingle();

  const expired =
    data?.submit_token_expires_at &&
    new Date(data.submit_token_expires_at as string) < new Date();

  if (!data || expired || data.submitted_at) {
    return (
      <>
        <PageHero>
          <h1 className="max-w-[20ch] text-hero">That link has expired</h1>
        </PageHero>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="article max-w-[58ch]">
            <p className="text-lede">
              Setup links work once and last seven days. If yours has run out,
              or you have already filled the form in and need to change
              something, we can sort it.
            </p>
            <p>
              Write in through the{" "}
              <Link href="/suggest?kind=other">suggestion box</Link> with the
              email address you paid with. Your subscription is unaffected and
              nothing needs paying again.
            </p>
          </div>
        </div>
      </>
    );
  }

  const plan = PLANS[data.plan as "banner" | "map"];

  return (
    <>
      <PageHero>
        <h1 className="max-w-[22ch] text-hero">Set up your advertisement</h1>
        <p className="mt-6 max-w-[58ch] text-lede text-[#cfc9bb]">
          You are on {plan.name}. Tell us what to show and we will look at it —
          usually the same day.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <AdvertiserSubmitForm
          token={token}
          plan={data.plan as "banner" | "map"}
          initial={{
            businessName:
              data.business_name === "New advertiser"
                ? ""
                : ((data.business_name as string) ?? ""),
            destinationUrl: (data.destination_url as string) ?? "",
            description: (data.description as string) ?? "",
            contactName: (data.contact_name as string) ?? "",
            locationName: (data.location_name as string) ?? "",
            address: (data.address as string) ?? "",
            latitude: data.latitude === null ? "" : String(data.latitude),
            longitude: data.longitude === null ? "" : String(data.longitude),
          }}
        />
      </div>
    </>
  );
}
