import type { SupabaseClient } from "@supabase/supabase-js";

const WINDOW_DAYS = 7;

export async function aggregatePatterns(supabase: SupabaseClient) {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - WINDOW_DAYS);

  const { data: recentCheckIns } = await supabase
    .from("check_ins")
    .select("id, time_estimate_minutes")
    .gte("created_at", periodStart.toISOString());

  if (!recentCheckIns || recentCheckIns.length === 0) return [];

  const checkInIds = recentCheckIns.map((c) => c.id);
  const minutesById = new Map(
    recentCheckIns.map((c) => [c.id, c.time_estimate_minutes ?? 30]),
  );

  const { data: tags } = await supabase
    .from("friction_tags")
    .select("category, check_in_id")
    .in("check_in_id", checkInIds)
    .not("category", "is", null);

  if (!tags || tags.length === 0) return [];

  const byCategory = new Map<string, number[]>();
  for (const tag of tags) {
    if (!tag.category) continue;
    const minutes = minutesById.get(tag.check_in_id) ?? 30;
    const list = byCategory.get(tag.category) ?? [];
    list.push(minutes);
    byCategory.set(tag.category, list);
  }

  const periodStartDate = periodStart.toISOString().slice(0, 10);
  const periodEndDate = periodEnd.toISOString().slice(0, 10);
  const updatedPatterns = [];

  for (const [category, minutesList] of byCategory) {
    const occurrence_count = minutesList.length;
    const avgMinutes =
      minutesList.reduce((sum, m) => sum + m, 0) / minutesList.length;
    const estimated_hours_per_week =
      Math.round(((occurrence_count * avgMinutes) / 60) * 10) / 10;

    const { data: existing } = await supabase
      .from("patterns")
      .select("id")
      .eq("category", category)
      .is("user_id", null)
      .maybeSingle();

    const row = {
      category,
      occurrence_count,
      estimated_hours_per_week,
      estimated_hours_source: "rule-based-aggregation",
      estimated_hours_confidence: 1,
      estimated_hours_review_status: "unreviewed",
      period_start: periodStartDate,
      period_end: periodEndDate,
    };

    if (existing) {
      const { data } = await supabase
        .from("patterns")
        .update(row)
        .eq("id", existing.id)
        .select()
        .single();
      if (data) updatedPatterns.push(data);
    } else {
      const { data } = await supabase
        .from("patterns")
        .insert(row)
        .select()
        .single();
      if (data) updatedPatterns.push(data);
    }
  }

  return updatedPatterns;
}
