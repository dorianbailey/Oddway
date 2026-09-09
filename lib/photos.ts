import { getServerSupabase } from "./supabase-server";

/** The bucket photographs live in. */
export const PHOTO_BUCKET = "stop-photos";

export interface StopPhoto {
  id: string;
  authorId: string;
  url: string;
  /*
    Carried alongside the URL because removing a photograph means deleting the
    stored object as well as the row, and the path is not recoverable from a
    public URL without string surgery that would break if the bucket moved.
  */
  storagePath: string;
  caption: string | null;
  altText: string | null;
  rating: number | null;
  photographer: string;
  createdAt: string;
}

export interface PendingPhoto extends StopPhoto {
  stopName: string;
  stopCity: string;
  stopState: string;
  status: string;
}

/** Public URL for a stored photograph. */
export function photoUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath}`;
}

/**
 * Approved photographs for a stop.
 *
 * The status filter here is belt as well as braces: the read policy already
 * hides anything unapproved or from a blocked account, so this returns nothing
 * extra even without it. Saying it in the query too means a page cannot
 * accidentally show pending work if a policy is ever loosened.
 */
export async function getStopPhotos(stopId: string): Promise<StopPhoto[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stop_photos")
    .select("id, author_id, storage_path, caption, alt_text, rating, created_at, profiles(display_name)")
    .eq("stop_id", stopId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error || !data) return [];

  const rows = data as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: row.id as string,
    authorId: row.author_id as string,
    url: photoUrl(row.storage_path as string),
    storagePath: row.storage_path as string,
    caption: (row.caption as string | null) ?? null,
    altText: (row.alt_text as string | null) ?? null,
    rating: row.rating === null ? null : Number(row.rating),
    photographer:
      (row.profiles as { display_name?: string } | null)?.display_name ?? "Unknown",
    createdAt: row.created_at as string,
  }));
}

/** The most recent approved photographs across the whole index. */
export async function getRecentPhotos(limit = 60): Promise<
  Array<StopPhoto & { stopSlug: string; stopName: string; stopCity: string; stopState: string }>
> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stop_photos")
    .select(
      "id, author_id, storage_path, caption, alt_text, rating, created_at, " +
        "profiles(display_name), stops(slug, name, city, state)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const rows = data as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const stop = row.stops as { slug: string; name: string; city: string; state: string } | null;
    return {
      id: row.id as string,
      authorId: row.author_id as string,
      url: photoUrl(row.storage_path as string),
      storagePath: row.storage_path as string,
      caption: (row.caption as string | null) ?? null,
      altText: (row.alt_text as string | null) ?? null,
      rating: row.rating === null ? null : Number(row.rating),
      photographer:
        (row.profiles as { display_name?: string } | null)?.display_name ?? "Unknown",
      createdAt: row.created_at as string,
      stopSlug: stop?.slug ?? "",
      stopName: stop?.name ?? "",
      stopCity: stop?.city ?? "",
      stopState: stop?.state ?? "",
    };
  });
}

/**
 * Everything awaiting review.
 *
 * Returns nothing at all unless the caller is an administrator, because the
 * policy that allows reading pending rows checks that. There is no separate
 * permission check in this function on purpose: one rule, in one place.
 */
export async function getPendingPhotos(): Promise<PendingPhoto[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stop_photos")
    .select(
      "id, storage_path, caption, alt_text, rating, created_at, status, author_id, " +
        "profiles(display_name), stops(name, city, state)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const rows = data as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const stop = row.stops as { name: string; city: string; state: string } | null;
    return {
      id: row.id as string,
      authorId: row.author_id as string,
      url: photoUrl(row.storage_path as string),
      storagePath: row.storage_path as string,
      caption: (row.caption as string | null) ?? null,
      altText: (row.alt_text as string | null) ?? null,
      rating: row.rating === null ? null : Number(row.rating),
      photographer:
        (row.profiles as { display_name?: string } | null)?.display_name ?? "Unknown",
      createdAt: row.created_at as string,
      stopName: stop?.name ?? "",
      stopCity: stop?.city ?? "",
      stopState: stop?.state ?? "",
      status: row.status as string,
    };
  });
}

/** Public URL for an avatar, or null when there is none. */
export function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  blocked: boolean;
}

/** Somebody's public profile, or null if there is nobody by that id. */
export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_path, bio, blocked")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    displayName: data.display_name as string,
    avatarUrl: avatarUrl((data.avatar_path as string | null) ?? null),
    bio: (data.bio as string | null) ?? null,
    blocked: Boolean(data.blocked),
  };
}

/** Everything a person has had approved. */
export async function getPhotosByAuthor(
  authorId: string,
): Promise<Array<StopPhoto & { stopSlug: string; stopName: string; stopCity: string; stopState: string }>> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stop_photos")
    .select(
      "id, author_id, storage_path, caption, alt_text, rating, created_at, " +
        "profiles(display_name), stops(slug, name, city, state)",
    )
    .eq("author_id", authorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const stop = row.stops as { slug: string; name: string; city: string; state: string } | null;
    return {
      id: row.id as string,
      authorId: row.author_id as string,
      url: photoUrl(row.storage_path as string),
      storagePath: row.storage_path as string,
      caption: (row.caption as string | null) ?? null,
      altText: (row.alt_text as string | null) ?? null,
      rating: row.rating === null ? null : Number(row.rating),
      photographer:
        (row.profiles as { display_name?: string } | null)?.display_name ?? "Unknown",
      createdAt: row.created_at as string,
      stopSlug: stop?.slug ?? "",
      stopName: stop?.name ?? "",
      stopCity: stop?.city ?? "",
      stopState: stop?.state ?? "",
    };
  });
}

/**
 * Photographs that have been hidden.
 *
 * Hiding sets the status to rejected and nothing else — the row survives and
 * so does the file, which is the whole point of it being different from
 * deleting. But a reversible action with nowhere to reverse it from is not
 * reversible in practice, which is what this exists to fix.
 *
 * Returns nothing unless the caller is an administrator, because the policy
 * that permits reading rejected rows checks that.
 */
export async function getHiddenPhotos(): Promise<PendingPhoto[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stop_photos")
    .select(
      "id, author_id, storage_path, caption, alt_text, rating, created_at, status, review_note, " +
        "profiles(display_name), stops(name, city, state)",
    )
    .eq("status", "rejected")
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error || !data) return [];

  const rows = data as unknown as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const stop = row.stops as { name: string; city: string; state: string } | null;
    return {
      id: row.id as string,
      authorId: row.author_id as string,
      url: photoUrl(row.storage_path as string),
      storagePath: row.storage_path as string,
      caption: (row.caption as string | null) ?? null,
      altText: (row.alt_text as string | null) ?? null,
      rating: row.rating === null ? null : Number(row.rating),
      photographer:
        (row.profiles as { display_name?: string } | null)?.display_name ?? "Unknown",
      createdAt: row.created_at as string,
      stopName: stop?.name ?? "",
      stopCity: stop?.city ?? "",
      stopState: stop?.state ?? "",
      status: row.status as string,
    };
  });
}
