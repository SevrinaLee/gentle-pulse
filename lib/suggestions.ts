import type { SupabaseClient } from "@supabase/supabase-js";
import { logAudit } from "./audit";
import type { Pattern } from "./types";
import { generateSuggestionContent } from "./suggestion-content";

export async function maybeGenerateSuggestions(
  supabase: SupabaseClient,
  patterns: Pattern[],
  userId: string,
) {
  for (const pattern of patterns) {
    if (pattern.occurrence_count < 3) continue;

    const { data: existing } = await supabase
      .from("suggestions")
      .select("id")
      .eq("pattern_id", pattern.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) continue;

    await logAudit(supabase, {
      action: "pattern.detected",
      target_table: "patterns",
      target_id: pattern.id,
      user_id: userId,
      payload: {
        category: pattern.category,
        occurrence_count: pattern.occurrence_count,
      },
    });

    // Templates when no OPENAI_API_KEY; GPT-4o-personalized copy (with template
    // fallback) when the key is present. See lib/suggestion-content.ts.
    const content = await generateSuggestionContent(pattern);
    const time_saved_minutes = Math.round(
      (pattern.estimated_hours_per_week ?? 1) * 60,
    );

    const { data: suggestion } = await supabase
      .from("suggestions")
      .insert({
        user_id: userId,
        pattern_id: pattern.id,
        headline: content.headline,
        body: content.body,
        body_source: content.source,
        body_confidence: content.confidence,
        body_review_status: "unreviewed",
        time_saved_minutes,
        difficulty_stars: content.difficulty_stars,
        energy_saved_stars: content.energy_saved_stars,
        chatgpt_prompt: content.chatgpt_prompt,
        template_text: content.template_text,
        n8n_link: null,
        status: "active",
      })
      .select()
      .single();

    if (suggestion) {
      await logAudit(supabase, {
        action: "suggestion.generated",
        target_table: "suggestions",
        target_id: suggestion.id,
        user_id: userId,
        payload: {
          pattern_id: pattern.id,
          headline: suggestion.headline,
          source: content.source,
        },
      });
    }
  }
}
