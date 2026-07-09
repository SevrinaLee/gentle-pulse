import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckInWithTag, Pattern, Suggestion } from "./types";

export async function getCheckInsWithTags(
  supabase: SupabaseClient,
  limit = 30,
): Promise<CheckInWithTag[]> {
  const { data: checkIns, error } = await supabase
    .from("check_ins")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !checkIns) throw error ?? new Error("Failed to load check-ins");
  if (checkIns.length === 0) return [];

  const { data: tags } = await supabase
    .from("friction_tags")
    .select("*")
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

export async function getPatternsRanked(
  supabase: SupabaseClient,
): Promise<Pattern[]> {
  const { data, error } = await supabase
    .from("patterns")
    .select("*")
    .order("estimated_hours_per_week", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getTopPattern(
  supabase: SupabaseClient,
): Promise<Pattern | null> {
  const patterns = await getPatternsRanked(supabase);
  return patterns.find((p) => p.occurrence_count >= 3) ?? null;
}

export async function getActiveSuggestionForPattern(
  supabase: SupabaseClient,
  patternId: string,
): Promise<Suggestion | null> {
  const { data } = await supabase
    .from("suggestions")
    .select("*")
    .eq("pattern_id", patternId)
    .eq("status", "active")
    .maybeSingle();

  return data ?? null;
}
