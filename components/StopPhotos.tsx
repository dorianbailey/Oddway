import Image from "next/image";
import type { StopPhoto } from "@/lib/photos";
import { PhotoAdminControls } from "./PhotoAdminControls";

/**
 * Visitor photographs on a stop's page.
 *
 * Credited by name, because that is the whole arrangement: somebody drove
 * there, took this, and gave it to the index.
 */
export function StopPhotos({
  photos,
  isAdmin = false,
}: {
  photos: StopPhoto[];
  isAdmin?: boolean;
}) {
  if (photos.length === 0) return null;

  return (
    <section className="mt-12 border-t border-contour/40 pt-8">
      <h2 className="text-title">From People Who Went</h2>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {photos.map((photo) => (
          <li key={photo.id}>
            <figure>
              <Image
                src={photo.url}
                alt={photo.altText ?? ""}
                width={800}
                height={800}
                unoptimized
                sizes="(max-width: 640px) 100vw, 340px"
                className="h-auto w-full border border-contour/45"
              />
              <figcaption className="mt-2 text-[0.9rem] text-ink-soft">
                {photo.caption ? (
                  <span className="block text-ink">{photo.caption}</span>
                ) : null}
                <a
                  href={`/people/${photo.authorId}`}
                  className="underline-offset-4 hover:text-route hover:underline"
                >
                  {photo.photographer}
                </a>
                {photo.rating !== null ? ` · ${photo.rating}/5` : ""}
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
    </section>
  );
}
