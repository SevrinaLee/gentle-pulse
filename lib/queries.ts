import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckInWithTag, Pattern, Suggestion } from "./types";

// All reads are explicitly scoped to a single owner id (the logged-in user, or
// the demo user for anonymous visitors). RLS enforces this at the DB layer too;
// the explicit .eq("user_id", …) is defense-in-depth and keeps a logged-in
// user's view from mixing in the public demo rows.

export async function getCheckInsWithTags(
  supabase: SupabaseClient,
  scopeId: string,
  limit = 30,
): Promise<CheckInWithTag[]> {
  const { data: checkIns, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", scopeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !checkIns) throw error ?? new Error("Failed to load check-ins");
  if (checkIns.length === 0) return [];

  const { data: tags } = await supabase
    .from("friction_tags")
    .select("*")
    .eq("user_id", scopeId)
    .in(
      "check_in_id",
      checkIns.map((c) => c.id),
    );

  const tagsByCheckIn = new Map((tags ?? []).map((t) => [t.check_in_id, t]));

  return checkIns.map((checkIn) => ({
    ...checkIn,
    friction_tag: tagsByCheckIn.get(checkIn.id) ?? null,
  }));
}

// Just the created_at timestamps for a user's recent check-ins — enough to
// compute a check-in streak without pulling full rows. Ordered newest-first;
// 90 days of history is plenty for any streak we'd surface.
export async function getCheckInTimestamps(
  supabase: SupabaseClient,
  scopeId: string,
  limit = 90,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("created_at")
    .eq("user_id", scopeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((r) => r.created_at as string);
}

export async function getPatternsRanked(
  supabase: SupabaseClient,
  scopeId: string,
): Promise<Pattern[]> {
  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .eq("user_id", scopeId)
    .order("estimated_hours_per_week", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getTopPattern(
  supabase: SupabaseClient,
  scopeId: string,
): Promise<Pattern | null> {
  const patterns = await getPatternsRanked(supabase, scopeId);
  return patterns.find((p) => p.occurrence_count >= 3) ?? null;
}

export async function getActiveSuggestionForPattern(
  supabase: SupabaseClient,
  patternId: string,
  scopeId: string,
): Promise<Suggestion | null> {
  const { data } = await supabase
    .from("suggestions")
    .select("*")
    .eq("pattern_id", patternId)
    .eq("user_id", scopeId)
    .eq("status", "active")
    .maybeSingle();

  return data ?? null;
}
