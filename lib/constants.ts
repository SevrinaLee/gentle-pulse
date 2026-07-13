/**
 * Permanent, non-login demo user id. Seed/demo rows are owned by this id and
 * are publicly readable (see supabase/migrations/0002_lockdown.sql). The
 * landing/demo page shows these rows to anonymous visitors. No one ever
 * authenticates as this user, so demo rows are effectively read-only.
 *
 * Keep in sync with the UUID literal in 0002_lockdown.sql.
 */
export const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000de";

/**
 * Canonical friction categories. Drives the correction dropdown and the
 * correction API's validation, and mirrors the categories the tagger can
 * assign (the keys of CATEGORY_KEYWORDS in lib/tagging.ts, plus the
 * "Uncategorized" fallback). Keep these two lists in sync.
 */
export const CATEGORIES = [
  "Customer Support",
  "Content Creation",
  "Product Uploads",
  "Marketing",
  "Admin & Bookkeeping",
  "Shipping & Fulfillment",
  "Uncategorized",
] as const;

export type Category = (typeof CATEGORIES)[number];
