import type { Pattern } from "./types";

// Suggestion *copy* generation. Structured exactly like lib/tagging.ts: a
// GPT-4o branch gated on OPENAI_API_KEY, with the hand-written templates below
// as the fallback whenever the key is absent OR the call fails. So today
// (no key) behaviour is unchanged, and dropping OPENAI_API_KEY into the
// environment activates personalized copy with no other change.
//
// This module has only type-only imports, so its pure pieces (templateContent,
// coerceSuggestion) can be compiled and unit-tested standalone.

export interface SuggestionContent {
  headline: string;
  body: string;
  chatgpt_prompt: string;
  template_text: string | null;
  difficulty_stars: number;
  energy_saved_stars: number;
  source: string; // "openai-gpt-4o" | "heuristic-fallback"
  confidence: number;
}

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
      "I keep running into a recurring work frustration in this area. Suggest one practical way to reduce the time it takes each week.",
    template_text: null,
    difficulty_stars: 3,
    energy_saved_stars: 3,
  },
};

// The fully-resolved template suggestion for a pattern — also the fallback the
// LLM path fills gaps from.
export function templateContent(pattern: Pattern): SuggestionContent {
  const t = TEMPLATES[pattern.category] ?? TEMPLATES.Uncategorized;
  return {
    headline: t.headline,
    body: t.body.replace("{{count}}", String(pattern.occurrence_count)),
    chatgpt_prompt: t.chatgpt_prompt,
    template_text: t.template_text,
    difficulty_stars: t.difficulty_stars,
    energy_saved_stars: t.energy_saved_stars,
    source: "heuristic-fallback",
    confidence: 0.6,
  };
}

// Validate/normalize a parsed LLM JSON object into SuggestionContent, filling
// any missing or invalid field from `fallback` so a partial/garbled response
// can never produce a worse suggestion than the template.
export function coerceSuggestion(
  parsed: unknown,
  fallback: SuggestionContent,
): SuggestionContent {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const str = (v: unknown, fb: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fb;
  const star = (v: unknown, fb: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : fb;
  };
  const templateText =
    typeof obj.template_text === "string"
      ? obj.template_text
      : obj.template_text === null
        ? null
        : fallback.template_text;

  return {
    headline: str(obj.headline, fallback.headline),
    body: str(obj.body, fallback.body),
    chatgpt_prompt: str(obj.chatgpt_prompt, fallback.chatgpt_prompt),
    template_text: templateText,
    difficulty_stars: star(obj.difficulty_stars, fallback.difficulty_stars),
    energy_saved_stars: star(obj.energy_saved_stars, fallback.energy_saved_stars),
    source: "openai-gpt-4o",
    confidence: 0.85,
  };
}

async function openaiSuggest(pattern: Pattern): Promise<SuggestionContent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const fallback = templateContent(pattern);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You advise a solopreneur on reducing a recurring work frustration. " +
            "You are given only an aggregate pattern (category, how many times it came up this week, estimated hours/week) — never their raw notes. " +
            "Return strict JSON with: " +
            '"headline" (short imperative fix, <8 words), ' +
            '"body" (1-2 sentences, may reference the count/hours), ' +
            '"chatgpt_prompt" (a ready-to-paste prompt they can run to get the fix), ' +
            '"template_text" (a reusable snippet if applicable, else null), ' +
            '"difficulty_stars" (integer 1-5, 1=easiest), ' +
            '"energy_saved_stars" (integer 1-5, 5=most relief).',
        },
        {
          role: "user",
          content: `Category: ${pattern.category}\nTimes this week: ${pattern.occurrence_count}\nEstimated hours/week: ${pattern.estimated_hours_per_week ?? "unknown"}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }
  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");

  return coerceSuggestion(JSON.parse(content), fallback);
}

// Entry point used by the suggestion generator. Key absent → templates.
// Key present → GPT-4o, falling back to templates on any failure.
export async function generateSuggestionContent(
  pattern: Pattern,
): Promise<SuggestionContent> {
  if (!process.env.OPENAI_API_KEY) return templateContent(pattern);
  try {
    return await openaiSuggest(pattern);
  } catch {
    return templateContent(pattern);
  }
}
