"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * The Supabase client for signed-in work in the browser.
 *
 * Separate from lib/supabase.ts on purpose. That one reads the index on the
 * server and never authenticates anybody; this one carries a session and is
 * used only by the account and upload pages.
 *
 * Keeping them apart means a page that only lists stops cannot accidentally
 * acquire the ability to write as a logged-in user.
 */
export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase credentials are missing. Accounts need NEXT_PUBLIC_SUPABASE_URL " +
        "and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient(url, key);
}
