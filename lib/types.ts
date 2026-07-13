export type ReviewStatus = "unreviewed" | "reviewed" | "pending" | "corrected";

export interface CheckIn {
  id: string;
  user_id: string | null;
  mood: string | null;
  raw_text: string;
  time_estimate_minutes: number | null;
  time_estimate_source: string | null;
  time_estimate_confidence: number | null;
  time_estimate_review_status: ReviewStatus;
  created_at: string;
}

export interface FrictionTag {
  id: string;
  user_id: string | null;
  check_in_id: string;
  category: string | null;
  // The tagger's original guess, preserved when a user later corrects the
  // category (null until the first correction). Kept as training signal.
  original_category: string | null;
  category_source: string | null;
  category_confidence: number | null;
  category_review_status: ReviewStatus;
  repeat_flag: boolean;
  repeat_flag_source: string | null;
  repeat_flag_confidence: number | null;
  repeat_flag_review_status: ReviewStatus;
  created_at: string;
}

export interface CheckInWithTag extends CheckIn {
  friction_tag: FrictionTag | null;
}

export interface SighEvent {
  id: string;
  user_id: string | null;
  follow_up_note: string | null;
  linked_check_in_id: string | null;
  created_at: string;
}

export interface Pattern {
  id: string;
  user_id: string | null;
  category: string;
  occurrence_count: number;
  estimated_hours_per_week: number | null;
  estimated_hours_source: string | null;
  estimated_hours_confidence: number | null;
  estimated_hours_review_status: ReviewStatus;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export type SuggestionStatus = "active" | "ignored" | "done";

export interface Suggestion {
  id: string;
  user_id: string | null;
  pattern_id: string | null;
  headline: string;
  body: string | null;
  body_source: string | null;
  body_confidence: number | null;
  body_review_status: ReviewStatus;
  time_saved_minutes: number | null;
  difficulty_stars: number | null;
  energy_saved_stars: number | null;
  chatgpt_prompt: string | null;
  template_text: string | null;
  n8n_link: string | null;
  status: SuggestionStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}
