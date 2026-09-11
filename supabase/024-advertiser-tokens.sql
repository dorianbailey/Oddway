-- The link an advertiser gets after paying.
--
-- Paying creates a row with nothing in it but an email address and a Stripe
-- subscription. The advertiser then needs somewhere to type their business
-- name and upload a banner, and they have no account — an account would be a
-- second thing to create on the way to spending fifty-nine dollars.
--
-- So: a token in an email. Which means the token is the only thing standing
-- between a stranger and that advertiser's banner and destination URL, and it
-- is treated accordingly.

alter table public.advertisers
  add column if not exists submit_token text unique,
  /*
    Seven days. Long enough to get round to it, short enough that a forwarded
    email found in an inbox two years from now is not a way in.
  */
  add column if not exists submit_token_expires_at timestamptz,
  /* Set when the form is saved, which is also when the token stops working. */
  add column if not exists submitted_at timestamptz;

create index if not exists advertisers_submit_token_idx
  on public.advertisers (submit_token)
  where submit_token is not null;

/*
  No policy is added for the token.

  The advertisers table stays closed to everyone but an administrator, and the
  submission form runs on the server with the service role — it looks the token
  up itself rather than handing the browser a key that could read the row. A
  policy allowing "anyone holding a token" would put the whole table one
  guessed string away from being readable.
*/

select
  count(*) filter (where submit_token is not null) as tokens_outstanding,
  count(*) as advertisers
from public.advertisers;
