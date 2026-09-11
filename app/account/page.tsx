import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { AccountPanel } from "@/components/AccountPanel";
import { BucketList } from "@/components/BucketList";
import { MapSection } from "@/components/MapSection";
import { PageHero } from "@/components/PageHero";
import { getCurrentProfile, getServerSupabase } from "@/lib/supabase-server";
import { getStopsBySlugs } from "@/lib/stops";
import { avatarUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  description: "Sign in to keep a bucket list and add photos of the places you have been.",
  // Nothing here belongs in a search index.
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const profile = user ? await getCurrentProfile() : null;

  /*
    The bucket list, read server-side.

    Two queries rather than one join returning every column: the first asks
    the bucket_list table what is on it, the second goes through the same
    getStopsBySlugs the trip pages use. That function already knows how to map
    a database row onto a Stop, and having a second place that does it
    differently is how the two drift.

    Row-level security does the filtering, not the eq() — but the eq() is
    there anyway, because a policy is a backstop and a query that relies on
    one is a query that breaks silently the day the policy is edited.
  */
  let bucket: Awaited<ReturnType<typeof getStopsBySlugs>> = [];
  if (user && supabase) {
    const { data } = await supabase
      .from("bucket_list")
      .select("added_at, stops (slug)")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    /*
      PostgREST types an embedded relation as an array, because it cannot know
      from the schema alone that this foreign key points at exactly one row.
      It does — stop_id is a single reference — but the generated type says
      otherwise, so both shapes are handled rather than asserted away.
    */
    const slugs = (data ?? []).flatMap((row) => {
      const joined = (row as { stops?: unknown }).stops;
      const rows = Array.isArray(joined) ? joined : joined ? [joined] : [];
      return rows
        .map((stop) => (stop as { slug?: unknown }).slug)
        .filter((slug): slug is string => typeof slug === "string");
    });

    if (slugs.length > 0) bucket = await getStopsBySlugs(slugs);
  }

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">
          {user ? "Your Account" : "Sign In"}
        </h1>
        <p className="mt-6 max-w-[58ch] text-lede text-[#cfc9bb]">
          {user
            ? "Keep a bucket list of places you mean to get to, and add photos of the ones you have."
            : "An account lets you keep a bucket list and add photos of the places you have been. Everything else on OddWay works without one."}
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        {user ? (
          <AccountPanel
            userId={user.id}
            isAdmin={profile?.is_admin ?? false}
            avatarUrl={avatarUrl(profile?.avatar_path ?? null)}
            bio={profile?.bio ?? null}
            email={user.email ?? ""}
            displayName={profile?.display_name ?? null}
            blocked={profile?.blocked ?? false}
          />
        ) : (
          <AuthForm />
        )}
      </div>

      {/*
        Outside the panel, which is a 40rem reading column. The map wants the
        full width and its own dark band, the way it does on the homepage.

        Only for somebody who has actually saved something. An empty map of the
        United States under the heading "Your bucket list" says nothing except
        that the feature exists, and the line below says that better.
      */}
      {user && profile?.display_name ? (
        bucket.length > 0 ? (
          <>
            <MapSection
              id="bucket-map"
              stops={bucket}
              isOverview
              heading="Your bucket list"
              intro="Places you have marked to get to one day. Only you can see this."
              note={null}
            />

            <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
              <BucketList stops={bucket} />
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-6xl px-5 pb-14 sm:px-8 sm:pb-16">
            <h2 className="text-section">Your bucket list</h2>
            <p className="mt-4 max-w-[52ch] text-ink-soft">
              Nothing on it yet. Every stop in the index has an{" "}
              <span className="font-semibold text-ink">Add to bucket list</span>{" "}
              button — saved places show up here on a map only you can see.
            </p>
            <p className="mt-5">
              <Link
                href="/explore"
                className="font-semibold text-route underline underline-offset-4"
              >
                Go and find some
              </Link>
            </p>
          </div>
        )
      ) : null}
    </>
  );
}
