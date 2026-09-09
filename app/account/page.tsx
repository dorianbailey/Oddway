import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AccountPanel } from "@/components/AccountPanel";
import { PageHero } from "@/components/PageHero";
import { getCurrentProfile, getServerSupabase } from "@/lib/supabase-server";
import { avatarUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  description: "Sign in to add photos of the places you have been.",
  // Nothing here belongs in a search index.
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const profile = user ? await getCurrentProfile() : null;

  return (
    <>
      <PageHero>
        <h1 className="max-w-[18ch] text-hero">
          {user ? "Your Account" : "Sign In"}
        </h1>
        <p className="mt-6 max-w-[58ch] text-lede text-[#cfc9bb]">
          {user
            ? "Add photos of the places you have been, and see what you have posted."
            : "An account lets you add photos of the places you have been. Nothing else on OddWay needs one."}
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
    </>
  );
}
