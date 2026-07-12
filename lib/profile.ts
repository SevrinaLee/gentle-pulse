import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  // Full access to all features, never gated behind future billing/paywalls.
  // Not settable by the user — protected by a DB trigger (see migration
  // 0006_protect_founder_flag.sql). No feature currently checks this; it's
  // in place for when a paywall exists.
  is_founder: boolean;
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}
