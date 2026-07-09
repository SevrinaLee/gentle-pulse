import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAudit(
  supabase: SupabaseClient,
  params: {
    action: string;
    target_table?: string;
    target_id?: string;
    payload?: Record<string, unknown>;
    user_id?: string | null;
  },
) {
  await supabase.from("audit_logs").insert({
    action: params.action,
    target_table: params.target_table ?? null,
    target_id: params.target_id ?? null,
    payload: params.payload ?? null,
    user_id: params.user_id ?? null,
  });
}
