import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_USER_ID } from "./constants";

/**
 * Returns the authenticated user's id, or null for anonymous visitors.
 * Uses getUser() (validates the JWT with Supabase) rather than getSession().
 */
export async function getUserId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * The user id whose rows should be shown. Logged-in users see their own data;
 * anonymous visitors see the public demo dataset.
 */
export async function getScopeId(supabase: SupabaseClient): Promise<{
  scopeId: string;
  isDemo: boolean;
  userId: string | null;
}> {
  const userId = await getUserId(supabase);
  return {
    scopeId: userId ?? DEMO_USER_ID,
    isDemo: userId === null,
    userId,
  };
}
