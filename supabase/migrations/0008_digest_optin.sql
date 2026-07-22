-- Sprint 5 — weekly digest email (opt-in)
-- Whether the user wants the weekly "your biggest drain" email. Unlike
-- is_founder (0006), this is the user's OWN preference, so it is freely
-- settable by the owner through the normal profiles_update_own RLS policy —
-- the is_founder protection trigger only guards that one column.
alter table profiles
  add column if not exists digest_opt_in boolean not null default false;
