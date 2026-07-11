-- EMERGENCY ROLLBACK for 0002_lockdown.sql — NOT a migration (kept out of
-- supabase/migrations/ on purpose so it is never auto-applied). Run manually
-- only if the owner-scoped RLS breaks the live demo and you need to restore the
-- permissive v1 behaviour while investigating.

drop policy if exists "check_ins_select_own_or_demo" on check_ins;
drop policy if exists "check_ins_insert_own"         on check_ins;
drop policy if exists "check_ins_update_own"         on check_ins;
drop policy if exists "check_ins_delete_own"         on check_ins;
drop policy if exists "friction_tags_select_own_or_demo" on friction_tags;
drop policy if exists "friction_tags_insert_own"         on friction_tags;
drop policy if exists "friction_tags_update_own"         on friction_tags;
drop policy if exists "friction_tags_delete_own"         on friction_tags;
drop policy if exists "sigh_events_select_own_or_demo" on sigh_events;
drop policy if exists "sigh_events_insert_own"         on sigh_events;
drop policy if exists "sigh_events_update_own"         on sigh_events;
drop policy if exists "sigh_events_delete_own"         on sigh_events;
drop policy if exists "patterns_select_own_or_demo" on patterns;
drop policy if exists "patterns_insert_own"         on patterns;
drop policy if exists "patterns_update_own"         on patterns;
drop policy if exists "patterns_delete_own"         on patterns;
drop policy if exists "suggestions_select_own_or_demo" on suggestions;
drop policy if exists "suggestions_insert_own"         on suggestions;
drop policy if exists "suggestions_update_own"         on suggestions;
drop policy if exists "suggestions_delete_own"         on suggestions;
drop policy if exists "audit_logs_select_own" on audit_logs;
drop policy if exists "audit_logs_insert_own" on audit_logs;

create policy "check_ins_v1_read" on check_ins for select using (true);
create policy "check_ins_v1_write" on check_ins for all using (true) with check (true);
create policy "friction_tags_v1_read" on friction_tags for select using (true);
create policy "friction_tags_v1_write" on friction_tags for all using (true) with check (true);
create policy "sigh_events_v1_read" on sigh_events for select using (true);
create policy "sigh_events_v1_write" on sigh_events for all using (true) with check (true);
create policy "patterns_v1_read" on patterns for select using (true);
create policy "patterns_v1_write" on patterns for all using (true) with check (true);
create policy "suggestions_v1_read" on suggestions for select using (true);
create policy "suggestions_v1_write" on suggestions for all using (true) with check (true);
create policy "audit_logs_v1_read" on audit_logs for select using (true);
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);
