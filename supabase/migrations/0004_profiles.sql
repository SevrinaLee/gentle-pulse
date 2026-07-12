-- User profiles: Name/Nickname alongside the auth.users row (which holds email
-- + password/OTP internals we don't want to touch directly).

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- No insert/delete policy for regular users: rows are created by the trigger
-- below (as the table owner, bypassing RLS) and removed via the cascade when
-- the auth.users row is deleted.

-- Auto-create a profile row whenever a new user signs up (magic-link first
-- login triggers an auth.users insert).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users created before this migration.
insert into profiles (id, display_name)
select u.id, split_part(u.email, '@', 1)
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;
