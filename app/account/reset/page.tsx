import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <>
      <PageHero>
        <h1 className="max-w-[20ch] text-hero">Set A New Password</h1>
      </PageHero>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <ResetPasswordForm />
      </div>
    </>
  );
}
