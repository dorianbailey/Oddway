import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * The Supabase client for server components that need to know who is signed in.
 *
 * Reads and writes the session cookie, so a page rendered on the server can
 * tell whether somebody is logged in without shipping that decision to the
 * browser.
 */
export async function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const store = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        /*
          Server components cannot set cookies. Next throws if you try, and the
          session refresh happens in the route handler instead — so this is
          deliberately a no-op rather than an error, which is what the Supabase
          docs recommend for this exact case.
        */
        try {
          toSet.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Rendering a page, not handling a request. Nothing to do.
        }
      },
    },
  });
}

/** The signed-in person's profile, or null. */
export async function getCurrentProfile() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, blocked, is_admin, avatar_path, bio")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
}
