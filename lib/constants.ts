/**
 * Permanent, non-login demo user id. Seed/demo rows are owned by this id and
 * are publicly readable (see supabase/migrations/0002_lockdown.sql). The
 * landing/demo page shows these rows to anonymous visitors. No one ever
 * authenticates as this user, so demo rows are effectively read-only.
 *
 * Keep in sync with the UUID literal in 0002_lockdown.sql.
 */
export const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000de";
