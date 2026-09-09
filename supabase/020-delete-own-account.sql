-- Letting somebody delete their own account.
--
-- The privacy page said this was "a gap rather than a policy" and asked people
-- to write in. That was honest but it is not good enough: asking a person to
-- request deletion by email, and then waiting on somebody to action it, is a
-- worse answer than a button, and in several places a legally worse one.
--
-- It needs a function because the anon key cannot touch auth.users. The usual
-- alternative is a route handler holding a service role key, which means a
-- key with unlimited rights sitting in the environment for the sake of one
-- operation. A definer function that can only ever delete the caller is a
-- smaller thing to get wrong.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  /*
    No argument, and the id comes from the session rather than the caller.

    A function taking a user id would be one typo away from letting anybody
    delete anybody, and no amount of checking inside would make that signature
    safe to read. There is nothing to pass, so there is nothing to get wrong.
  */
  if caller is null then
    raise exception 'Not signed in.';
  end if;

  /*
    Deleting the auth user cascades: profiles references auth.users with
    on delete cascade, and stop_photos references profiles the same way. So
    this one statement removes the account, the profile, and every photograph
    record belonging to it.

    The image files themselves are removed by the client before this runs,
    because deleting rows from storage.objects leaves the underlying files
    behind — the storage API deletes both, a SQL delete only the record.
  */
  delete from auth.users where id = caller;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

select
  p.proname,
  p.prosecdef as security_definer,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'delete_own_account';
