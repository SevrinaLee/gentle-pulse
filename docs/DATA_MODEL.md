# Data Model

## check_ins
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | owner scope at lock-down |
| mood | text | emoji string |
| raw_text | text NOT NULL | user's words verbatim |
| time_estimate_minutes | integer | AI-generated |
| time_estimate_source | text | e.g. `openai-gpt-4o` |
| time_estimate_confidence | numeric | 0–1 |
| time_estimate_review_status | text | default `unreviewed` |
| created_at | timestamptz | |

## friction_tags
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| check_in_id | uuid FK → check_ins | cascade delete |
| category | text | AI-generated (e.g. `Customer Support`) |
| category_source / confidence / review_status | text / numeric / text | AI provenance |
| repeat_flag | boolean | AI-generated |
| repeat_flag_source / confidence / review_status | text / numeric / text | |

## sigh_events
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| follow_up_note | text nullable | |
| linked_check_in_id | uuid FK → check_ins nullable | set after follow-up |
| created_at | timestamptz | |

## patterns
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| category | text | |
| occurrence_count | integer | |
| estimated_hours_per_week | numeric | AI-generated |
| estimated_hours_source / confidence / review_status | text / numeric / text | |
| period_start / period_end | date | |

## suggestions
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| pattern_id | uuid FK → patterns nullable | |
| headline | text | |
| body | text | AI-generated |
| body_source / confidence / review_status | text / numeric / text | |
| time_saved_minutes | integer | |
| difficulty_stars | integer 1–5 | |
| energy_saved_stars | integer 1–5 | |
| chatgpt_prompt / template_text / n8n_link | text nullable | |
| status | text | `active` \| `ignored` \| `done` |

## audit_logs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid nullable | |
| action | text | e.g. `suggestion.ignored` |
| target_table / target_id | text / uuid | |
| payload | jsonb | |

**RLS:** All tables have permissive v1 policies (select + all using true). Replaced with `auth.uid() = user_id` at the lock-down sprint.
