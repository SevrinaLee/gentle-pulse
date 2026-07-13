import { CATEGORIES } from "./constants";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Customer Support": [
    "customer",
    "dm",
    "message",
    "messages",
    "reply",
    "replying",
    "replied",
    "email",
    "emails",
    "question",
    "asked",
    "support",
    "complaint",
    "inquiry",
    "enquiries",
    "enquiry",
  ],
  "Content Creation": [
    "caption",
    "captions",
    "content",
    "post",
    "posting",
    "instagram",
    "newsletter",
    "write",
    "writing",
    "wrote",
    "blog",
    "video",
    "photo",
    "photos",
    "social media",
  ],
  "Product Uploads": [
    "upload",
    "uploading",
    "uploaded",
    "listing",
    "listings",
    "shopee",
    "etsy",
    "product",
    "products",
    "inventory",
    "stock",
    "catalog",
  ],
  Marketing: ["ads", "advert", "marketing", "promo", "discount", "campaign"],
  "Admin & Bookkeeping": [
    "invoice",
    "invoices",
    "accounting",
    "tax",
    "taxes",
    "spreadsheet",
    "bookkeeping",
    "admin",
    "paperwork",
    "receipt",
  ],
  "Shipping & Fulfillment": [
    "ship",
    "shipping",
    "shipped",
    "package",
    "packaging",
    "courier",
    "delivery",
    "parcel",
  ],
};

const REPEAT_PHRASES = [
  "again",
  "every day",
  "every week",
  "every time",
  "every single",
  "every month",
  "always",
  "constantly",
  "all the time",
];

export interface TagResult {
  category: string | null;
  category_confidence: number | null;
  repeat_flag: boolean;
  repeat_flag_confidence: number | null;
  time_estimate_minutes: number | null;
  time_estimate_confidence: number | null;
  source: string;
  failed: boolean;
}

function heuristicTag(rawText: string): TagResult {
  const text = rawText.toLowerCase();

  let bestCategory: string | null = null;
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce(
      (count, kw) => count + (text.includes(kw) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  const category = bestCategory ?? "Uncategorized";
  const repeat_flag = REPEAT_PHRASES.some((phrase) => text.includes(phrase));

  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  let time_estimate_minutes = 20;
  if (wordCount > 50) time_estimate_minutes = 120;
  else if (wordCount > 25) time_estimate_minutes = 75;
  else if (wordCount > 10) time_estimate_minutes = 45;

  return {
    category,
    category_confidence: bestCategory ? 0.6 : 0.4,
    repeat_flag,
    repeat_flag_confidence: 0.55,
    time_estimate_minutes,
    time_estimate_confidence: 0.55,
    source: "heuristic-fallback",
    failed: false,
  };
}

async function openaiTag(rawText: string): Promise<TagResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  // Single source of truth for the category set — shared with the correction
  // dropdown and API validation (lib/constants.ts).
  const categories = [...CATEGORIES];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You tag a solopreneur's daily work-frustration check-in. Return strict JSON: {"category": one of ${JSON.stringify(
            categories,
          )}, "category_confidence": 0-1, "time_estimate_minutes": integer minutes this task type likely costs, "time_estimate_confidence": 0-1, "repeat_flag": boolean whether the text implies this is a recurring frustration, "repeat_flag_confidence": 0-1}`,
        },
        { role: "user", content: rawText },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");

  const parsed = JSON.parse(content);
  return {
    category: parsed.category ?? null,
    category_confidence: parsed.category_confidence ?? null,
    repeat_flag: Boolean(parsed.repeat_flag),
    repeat_flag_confidence: parsed.repeat_flag_confidence ?? null,
    time_estimate_minutes: parsed.time_estimate_minutes ?? null,
    time_estimate_confidence: parsed.time_estimate_confidence ?? null,
    source: "openai-gpt-4o",
    failed: false,
  };
}

export async function tagCheckIn(rawText: string): Promise<TagResult> {
  if (!process.env.OPENAI_API_KEY) {
    return heuristicTag(rawText);
  }

  try {
    return await openaiTag(rawText);
  } catch {
    return {
      category: null,
      category_confidence: null,
      repeat_flag: false,
      repeat_flag_confidence: null,
      time_estimate_minutes: null,
      time_estimate_confidence: null,
      source: "openai-gpt-4o",
      failed: true,
    };
  }
}
