import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getRecentPhotos } from "@/lib/photos";
import { getCurrentProfile } from "@/lib/supabase-server";
import { PhotoAdminControls } from "@/components/PhotoAdminControls";

/*
  Rendered per request rather than cached, because the moderation controls
  depend on who is asking. A cached page would either show them to everybody
  or to nobody.
*/
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photos from the road",
  description:
    "Photographs of strange places, taken by people who drove there.",
};

export default async function PhotosPage() {
  const photos = await getRecentPhotos();
  const profile = await getCurrentProfile();
  const isAdmin = profile?.is_admin ?? false;

  return (
    <>
      <PageHero>
        <h1 className="max-w-[20ch] text-hero">Took The OddWay</h1>
        <p className="mt-6 max-w-[58ch] text-lede text-[#cfc9bb]">
          Photographs from people who actually went. Every one is attached to a
          place in the index.
        </p>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        {photos.length === 0 ? (
          <p className="max-w-[52ch] border-l-2 border-contour pl-4 text-lede text-ink-soft">
            No photos yet.{" "}
            <Link
              href="/account"
              className="font-semibold text-route underline underline-offset-4"
            >
              Add the first one
            </Link>
            .
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
                      {photo.stopCity}, {photo.stopState} &middot;{" "}
                      {photo.photographer}
                      {photo.rating !== null ? ` · ${photo.rating}/5` : ""}
                    </span>
                    {photo.caption ? (
                      <span className="mt-1 block text-[0.9rem]">
                        {photo.caption}
                      </span>
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
