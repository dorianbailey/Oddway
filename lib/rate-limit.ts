import { createHash } from "node:crypto";
import { getSupabase } from "./supabase";

/**
 * A rate limit every serverless instance shares.
 *
 * The routes that needed this each had their own counter in a module-level
 * variable, which on Vercel counts requests per instance rather than per
 * caller — and a new instance starts at zero. The limit fired rarely and
 * almost never on the traffic it was meant to stop.
 *
 * Postgres is the only thing all the instances can see, so the count lives
 * there and the decision is made in one atomic statement.
 */

/**
 * Who is calling, as a hash.
 *
 * Never the address itself. This is here to slow somebody down, not to keep a
 * record of who visited, and a hash cannot be read back into an IP — so the
 * privacy page can still say we do not store them.
 *
 * The salt is a secret that already exists on every deployment. Without one
 * the hashes would be guessable: the space of IPv4 addresses is small enough
 * to walk through in an afternoon.
 */
function bucketFor(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const address = forwarded.split(",")[0]?.trim() || "unknown";
  const salt = process.env.REVALIDATE_SECRET ?? "oddway";

  return createHash("sha256")
    .update(`${salt}:${scope}:${address}`)
    .digest("base64url")
    .slice(0, 32);
}

/**
 * True when the caller may proceed.
 *
 * Fails **open**. A limiter that blocks the site when the database hiccups has
 * turned a spam problem into an outage, and these endpoints are a suggestion
 * form and an autocomplete — the cost of letting a few extra through is much
 * lower than the cost of turning them off for everybody.
 *
 * The opposite choice is right for the advertising slot count, which fails
 * closed: overselling is worse than refusing a sale.
 */
export async function withinRateLimit(
  request: Request,
  scope: string,
  maxHits: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      bucket_key: bucketFor(request, scope),
      max_hits: maxHits,
      window_seconds: windowSeconds,
    });

    if (error) throw new Error(error.message);
    return data !== false;
  } catch (caught) {
    console.error(`Rate limit check failed for ${scope}:`, caught);
    return true;
  }
}
