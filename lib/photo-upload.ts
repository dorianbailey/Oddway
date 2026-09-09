/**
 * Preparing a photograph for upload.
 *
 * Two jobs, both done in the browser before anything leaves the device.
 *
 * The first is stripping metadata. A photograph taken on a phone carries EXIF
 * tags including the exact coordinates it was taken at, the time, and often a
 * device identifier. Somebody uploading a picture of a roadside statue does
 * not expect to publish the GPS fix of wherever they happened to be, and would
 * be right to be upset about it. Drawing the image to a canvas and re-encoding
 * discards every tag, because a canvas has no concept of them.
 *
 * The second is size. Phone cameras produce eight megabyte files and a web
 * page needs a fraction of that. Resizing before upload saves the visitor's
 * data allowance as well as the storage bill.
 */

/** Long edge, in pixels. Enough for a full-width photograph on a large screen. */
const MAX_EDGE = 1600;

/** Anything larger than this is refused before the resize is attempted. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export interface PreparedPhoto {
  blob: Blob;
  width: number;
  height: number;
  /** What the original weighed, so the saving can be shown. */
  originalBytes: number;
}

export class PhotoError extends Error {}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new PhotoError(
      "That file type is not supported. JPEG, PNG or WebP work best.",
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoError("That photo is over 25MB. Try one straight from your camera roll.");
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new PhotoError("That file could not be read as an image.");
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new PhotoError("Could not process that image in this browser.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
  if (!blob) throw new PhotoError("Could not process that image in this browser.");

  return { blob, width, height, originalBytes: file.size };
}

/**
 * Where a photograph lives in the bucket.
 *
 * The author's id is the first path segment so that storage policies can
 * compare it against auth.uid(): a person may write inside their own folder
 * and nowhere else. A random id follows, because filenames from a camera roll
 * collide constantly and can carry personal information of their own.
 */
export function storagePath(authorId: string, stopSlug: string): string {
  /*
    The slug is sanitised even though every slug in this index is already
    url-safe. Relying on the caller to pass something clean is how a path
    traversal gets in later, when somebody calls this with a value from a form
    rather than from the database.
  */
  const safeSlug = stopSlug.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").slice(0, 80);
  const random = crypto.randomUUID();
  return `${authorId}/${safeSlug}/${random}.webp`;
}

/**
 * An avatar, squared and shrunk.
 *
 * Cropped to a square from the centre rather than squashed, because a portrait
 * photograph stretched into a circle looks like a mistake. 256 pixels is twice
 * what the largest avatar on the site displays at, which covers high density
 * screens without carrying a photograph nobody sees at full size.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new PhotoError("JPEG, PNG or WebP, please.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoError("That image is too large.");
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new PhotoError("That file could not be read as an image.");
  });

  const SIZE = 256;
  const edge = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - edge) / 2;
  const sy = (bitmap.height - edge) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new PhotoError("Could not process that image in this browser.");

  context.drawImage(bitmap, sx, sy, edge, edge, 0, 0, SIZE, SIZE);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new PhotoError("Could not process that image in this browser.");
  return blob;
}

/** Avatars live under the owner's id, same as photographs. */
export function avatarPath(authorId: string): string {
  return `${authorId}/${crypto.randomUUID()}.webp`;
}
