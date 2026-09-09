import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { getPhotosByAuthor, getPublicProfile } from "@/lib/photos";
import { getCurrentProfile } from "@/lib/supabase-server";
import { PhotoAdminControls } from "@/components/PhotoAdminControls";

export const dynamic = "force-dynamic";

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile || profile.blocked) return { title: "Not found" };

  return {
    title: `Photos by ${profile.displayName}`,
    description: `Places ${profile.displayName} has photographed for OddWay.`,
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  // A blocked account has no public page, the same as one that never existed.
  if (!profile || profile.blocked) notFound();

  const photos = await getPhotosByAuthor(profile.id);
  const viewer = await getCurrentProfile();
  const isAdmin = viewer?.is_admin ?? false;

  return (
    <>
      <PageHero>
        <div className="flex items-center gap-5">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-full border border-brass/30 object-cover"
            />
          ) : null}
          <div>
            <h1 className="text-hero">{profile.displayName}</h1>
            {profile.bio ? (
              <p className="mt-2 max-w-[46ch] text-[#cfc9bb]">{profile.bio}</p>
            ) : null}
            <p className="mt-2 text-[0.95rem] text-[#cfc9bb]">
              {photos.length === 0
                ? "No photos yet"
                : `${photos.length} photo${photos.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        {photos.length === 0 ? (
          <p className="border-l-2 border-contour pl-4 text-lede text-ink-soft">
            Nothing here yet.
          </p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.id}>
                <figure>
                  <Link href={`/stops/${photo.stopSlug}`}>
                    <Image
                      src={photo.url}
                      alt={photo.altText ?? ""}
                      width={800}
                      height={800}
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                      className="h-auto w-full border border-contour/45 transition-opacity hover:opacity-90"
                    />
                  </Link>
                  <figcaption className="mt-2">
                    <Link
                      href={`/stops/${photo.stopSlug}`}
                      className="font-semibold underline-offset-4 hover:text-route hover:underline"
                    >
                      {photo.stopName}
                    </Link>
                    <span className="block text-[0.9rem] text-ink-soft">
                      {photo.stopCity}, {photo.stopState}
                      {photo.rating !== null ? ` · ${photo.rating}/5` : ""}
                    </span>
                    {photo.caption ? (
                      <span className="mt-1 block text-[0.9rem]">{photo.caption}</span>
                    ) : null}
                    {isAdmin ? (
                      <PhotoAdminControls
                        photoId={photo.id}
                        storagePath={photo.storagePath}
                        photographer={photo.photographer}
                      />
                    ) : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
