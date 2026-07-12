-- Security fix: RLS's "update own profile" policy (0004) authorizes WHICH
-- ROW a user can update, not which COLUMNS — so any authenticated user could
-- PATCH .../profiles?id=eq.<their own id> with {"is_founder": true} directly
-- against the Supabase REST API (bypassing the app's own /api/account/profile
-- route entirely, which never touches this column) and grant themselves
-- founder status. Confirmed exploitable before this fix.
--
-- Fix: a trigger that silently reverts any change to is_founder unless the
-- request is authenticated as service_role (which the client never has —
-- only server-side scripts using SUPABASE_SERVICE_ROLE_KEY do).

create or replace function public.protect_is_founder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.is_founder := old.is_founder;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_founder_trigger on profiles;
create trigger protect_is_founder_trigger
  before update on profiles
  for each row execute function public.protect_is_founder();
