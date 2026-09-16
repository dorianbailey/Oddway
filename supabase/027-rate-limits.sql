-- A rate limiter every instance can see.
--
-- Both public write endpoints already counted requests, in a module-level
-- variable. On Vercel that is close to useless: each invocation may get a fresh
-- instance with the counter back at zero, so "ten per minute" is really "ten
-- per minute per instance", and an attacker opening connections in parallel
-- gets as many instances as they like. The comments in those routes said as
-- much and named this as the fix.
--
-- Postgres is the only thing all the instances share.

create table if not exists public.rate_limits (
  /*
    A salted hash of the caller's address plus the endpoint name — never the
    address itself. This table exists to slow abuse down, not to build a record
    of who visited: a hash cannot be read back into an IP, and the privacy page
    can still say we do not keep them.
  */
  bucket       text primary key,
  hits         integer not null default 0,
  window_start timestamptz not null default now()
);

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
-- No policies at all: nothing but the function below touches this table, and
-- that runs as its owner.

/**
 * Count one request and say whether it is allowed.
 *
 * Atomic on purpose. Reading the count and then writing it would let two
 * simultaneous requests both see nine and both decide they were the tenth;
 * doing it in one statement makes that impossible.
 *
 * Returns true when the caller is under the limit.
 */
create or replace function public.rate_limit_hit(
  bucket_key text,
  max_hits integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits integer;
begin
  insert into public.rate_limits as r (bucket, hits, window_start)
  values (bucket_key, 1, now())
  on conflict (bucket) do update
    set
      -- A window that has run out starts again rather than accumulating
      -- forever, so somebody who was throttled an hour ago is not still paying
      -- for it.
      hits = case
        when r.window_start < now() - make_interval(secs => window_seconds)
        then 1
        else r.hits + 1
      end,
      window_start = case
        when r.window_start < now() - make_interval(secs => window_seconds)
        then now()
        else r.window_start
      end
  returning r.hits into current_hits;

  return current_hits <= max_hits;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public;
grant execute on function public.rate_limit_hit(text, integer, integer) to anon, authenticated;

/**
 * Housekeeping. Rows older than a day are spent and nobody will look at them
 * again; left alone the table grows forever for no reason.
 */
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;

select count(*) as existing_rows from public.rate_limits;
