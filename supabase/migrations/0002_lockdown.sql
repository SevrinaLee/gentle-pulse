-- Sprint 4 — Lock it down
-- Replaces the permissive v1 RLS policies (using(true)) with owner-scoped
-- policies (auth.uid() = user_id). Seed/demo rows are assigned to a permanent
-- demo user id and stay PUBLICLY READABLE so the landing/demo page keeps
-- working for anonymous visitors. Writes now require authentication.
--
-- Demo user id is a fixed, non-login UUID. It is mirrored in lib/constants.ts
-- (DEMO_USER_ID) — keep the two in sync.

-- 1. Assign existing seed rows (created with user_id NULL) to the demo user.
update check_ins    set user_id = '00000000-0000-0000-0000-0000000000de' where user_id is null;
update friction_tags set user_id = '00000000-0000-0000-0000-0000000000de' where user_id is null;
update sigh_events  set user_id = '00000000-0000-0000-0000-0000000000de' where user_id is null;
update patterns     set user_id = '00000000-0000-0000-0000-0000000000de' where user_id is null;
update suggestions  set user_id = '00000000-0000-0000-0000-0000000000de' where user_id is null;

-- 2. Drop the permissive v1 policies.
drop policy if exists "check_ins_v1_read"      on check_ins;
drop policy if exists "check_ins_v1_write"     on check_ins;
drop policy if exists "friction_tags_v1_read"  on friction_tags;
drop policy if exists "friction_tags_v1_write" on friction_tags;
drop policy if exists "sigh_events_v1_read"    on sigh_events;
drop policy if exists "sigh_events_v1_write"   on sigh_events;
drop policy if exists "patterns_v1_read"       on patterns;
drop policy if exists "patterns_v1_write"      on patterns;
drop policy if exists "suggestions_v1_read"    on suggestions;
drop policy if exists "suggestions_v1_write"   on suggestions;
drop policy if exists "audit_logs_v1_read"     on audit_logs;
drop policy if exists "audit_logs_v1_write"    on audit_logs;

-- 3. Owner-scoped policies. Pattern for the five user-data tables:
--    SELECT  = own rows OR demo rows (demo public-readable for the landing page)
--    INSERT  = only rows you own
--    UPDATE  = only rows you own
--    DELETE  = only rows you own
-- Anonymous callers have auth.uid() = NULL, so they can read demo rows only and
-- cannot write anything.

-- check_ins
create policy "check_ins_select_own_or_demo" on check_ins
  for select using (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-0000000000de');
create policy "check_ins_insert_own" on check_ins
  for insert with check (user_id = auth.uid());
create policy "check_ins_update_own" on check_ins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "check_ins_delete_own" on check_ins
  for delete using (user_id = auth.uid());

-- friction_tags
create policy "friction_tags_select_own_or_demo" on friction_tags
  for select using (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-0000000000de');
create policy "friction_tags_insert_own" on friction_tags
  for insert with check (user_id = auth.uid());
create policy "friction_tags_update_own" on friction_tags
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "friction_tags_delete_own" on friction_tags
  for delete using (user_id = auth.uid());

-- sigh_events
create policy "sigh_events_select_own_or_demo" on sigh_events
  for select using (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-0000000000de');
create policy "sigh_events_insert_own" on sigh_events
  for insert with check (user_id = auth.uid());
create policy "sigh_events_update_own" on sigh_events
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sigh_events_delete_own" on sigh_events
  for delete using (user_id = auth.uid());

-- patterns
create policy "patterns_select_own_or_demo" on patterns
  for select using (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-0000000000de');
create policy "patterns_insert_own" on patterns
  for insert with check (user_id = auth.uid());
create policy "patterns_update_own" on patterns
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "patterns_delete_own" on patterns
  for delete using (user_id = auth.uid());

-- suggestions
create policy "suggestions_select_own_or_demo" on suggestions
  for select using (user_id = auth.uid() or user_id = '00000000-0000-0000-0000-0000000000de');
create policy "suggestions_insert_own" on suggestions
  for insert with check (user_id = auth.uid());
create policy "suggestions_update_own" on suggestions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "suggestions_delete_own" on suggestions
  for delete using (user_id = auth.uid());

-- audit_logs — append-only, strictly private. No demo read, no update/delete
-- policies at all (so those operations are denied by RLS for everyone).
create policy "audit_logs_select_own" on audit_logs
  for select using (user_id = auth.uid());
create policy "audit_logs_insert_own" on audit_logs
  for insert with check (user_id = auth.uid());
