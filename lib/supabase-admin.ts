import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * A Supabase client that ignores row level security.
 *
 * Two callers need this and no others: the Stripe webhook, which writes an
 * advertiser row for somebody who has no account and therefore no identity to
 * check a policy against, and the submission form, which reads that row by
 * token.
 *
 * The key bypasses every policy in the database. It has no NEXT_PUBLIC_ prefix
 * and must never be given one — that prefix compiles a value into the browser
 * bundle, and this particular value would hand every visitor the ability to
 * read every account's email address and edit anybody's bucket list.
 *
 * Importing this file from a client component is a mistake the type system
 * will not catch, so the guard below turns it into an error at the first call
 * rather than a silent success that ships a key.
 */

let client: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "getAdminSupabase() was called in the browser. The service role key must never reach the client.",
    );
  }

  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The advertising routes cannot run without it.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
