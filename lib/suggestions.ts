import type { SupabaseClient } from "@supabase/supabase-js";
import { logAudit } from "./audit";
import type { Pattern } from "./types";

interface SuggestionTemplate {
  headline: string;
  body: string;
  chatgpt_prompt: string;
  template_text: string | null;
  difficulty_stars: number;
  energy_saved_stars: number;
}

const TEMPLATES: Record<string, SuggestionTemplate> = {
  "Customer Support": {
    headline: "Create a Customer Support FAQ reply bank",
    body: "You've answered the same questions {{count}} times this week. A saved-reply bank would cut this to near zero.",
    chatgpt_prompt:
      "Write 10 concise customer-support reply templates covering: shipping time, pricing, product details, custom orders, and returns. Friendly tone, under 3 sentences each.",
    template_text:
      "Hi [Name]! Thanks for reaching out 💜 [Answer]. Let me know if you need anything else!",
    difficulty_stars: 1,
    energy_saved_stars: 5,
  },
  "Content Creation": {
    headline: "Build a weekly content batch system",
    body: "You spent significant time on content this week. Batching it into one focused session per week saves context-switching time.",
    chatgpt_prompt:
      "Generate 7 social media captions for my small business. Cover: behind-the-scenes, customer love, product feature, a tip, a promo, a question for engagement, and a weekend mood post. Warm, authentic tone.",
    template_text: null,
    difficulty_stars: 2,
    energy_saved_stars: 4,
  },
  "Product Uploads": {
    headline: "Batch your product uploads with a spreadsheet template",
    body: "Manual one-by-one uploads are eating your time. A CSV bulk-upload template turns this into a five-minute job.",
    chatgpt_prompt:
      "Create a CSV column template for bulk-uploading products to an e-commerce platform, with example rows for a handmade goods shop.",
    template_text: null,
    difficulty_stars: 2,
    energy_saved_stars: 3,
  },
  Marketing: {
    headline: "Pre-plan a month of promos in one sitting",
    body: "Ad-hoc marketing decisions are costing you repeat time. Planning a month of promos at once removes the daily back-and-forth.",
    chatgpt_prompt:
      "Draft a 4-week promotional calendar for a small handmade-goods business, one theme per week, each with a one-line hook.",
    template_text: null,
    difficulty_stars: 2,
    energy_saved_stars: 3,
  },
  "Admin & Bookkeeping": {
    headline: "Set a single weekly admin block",
    body: "Bookkeeping and paperwork keep interrupting your week in small chunks. One dedicated block reclaims that time.",
    chatgpt_prompt:
      "Suggest a simple weekly bookkeeping checklist for a solo small-business owner, doable in under 60 minutes.",
    template_text: null,
    difficulty_stars: 1,
    energy_saved_stars: 3,
  },
  "Shipping & Fulfillment": {
    headline: "Standardize your shipping workflow",
    body: "Repeated shipping tasks are a recurring drain. A fixed packing/labeling routine cuts decision fatigue.",
    chatgpt_prompt:
      "Write a step-by-step shipping and packaging checklist for a small handmade-goods business to speed up fulfillment.",
    template_text: null,
    difficulty_stars: 2,
    energy_saved_stars: 3,
  },
  Uncategorized: {
    headline: "This is becoming a recurring drain",
    body: "This type of task has come up repeatedly this week. Worth a closer look at whether it can be templated or delegated.",
    chatgpt_prompt:
      "I keep running into this recurring work frustration: \"{{text}}\". Suggest one practical way to reduce the time this takes each week.",
    template_text: null,
    difficulty_stars: 3,
    energy_saved_stars: 3,
  },
};

export async function maybeGenerateSuggestions(
  supabase: SupabaseClient,
  patterns: Pattern[],
) {
  for (const pattern of patterns) {
    if (pattern.occurrence_count < 3) continue;

    const { data: existing } = await supabase
      .from("suggestions")
      .select("id")
      .eq("pattern_id", pattern.id)
      .maybeSingle();

    if (existing) continue;

    await logAudit(supabase, {
      action: "pattern.detected",
      target_table: "patterns",
      target_id: pattern.id,
      payload: {
        category: pattern.category,
        occurrence_count: pattern.occurrence_count,
      },
    });

    const template = TEMPLATES[pattern.category] ?? TEMPLATES.Uncategorized;
    const time_saved_minutes = Math.round(
      (pattern.estimated_hours_per_week ?? 1) * 60,
    );

    const { data: suggestion } = await supabase
      .from("suggestions")
      .insert({
        pattern_id: pattern.id,
        headline: template.headline,
        body: template.body.replace(
          "{{count}}",
          String(pattern.occurrence_count),
        ),
        body_source: "heuristic-fallback",
        body_confidence: 0.6,
        body_review_status: "unreviewed",
        time_saved_minutes,
        difficulty_stars: template.difficulty_stars,
        energy_saved_stars: template.energy_saved_stars,
        chatgpt_prompt: template.chatgpt_prompt,
        template_text: template.template_text,
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
        payload: { pattern_id: pattern.id, headline: suggestion.headline },
      });
    }
  }
}
