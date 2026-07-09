# Agentic Layer

## Risk Levels & Actions

### Low Risk — Auto-executed (no approval needed)
- Tag a check-in with category, time estimate, repeat flag
- Aggregate patterns from check-in history
- Generate suggestion headline + body draft
- Score difficulty_stars and energy_saved_stars

### Medium Risk — Shown to user before saving
- Draft a ChatGPT prompt for the suggestion drawer
- Suggest an n8n workflow link based on category
- Mark a pattern as `resolved` after user confirms

### High Risk — User explicitly triggers
- Send a weekly digest email (later sprint; user opts in)
- Export check-in history to CSV

### Critical — Human only
- Delete all user data
- Any billing or account action

## Named Tools (v1)
- `tag_check_in(check_in_id)` — calls GPT-4o, writes friction_tags row
- `aggregate_patterns(user_id, days=7)` — SQL aggregation, upserts patterns rows
- `generate_suggestion(pattern_id)` — calls GPT-4o, writes suggestions row with review_status

## Audit Log Fields
`action | target_table | target_id | payload (input + output) | user_id | created_at`
Every named tool call writes one audit_log row before and after execution.

## v1 vs Later
- **v1:** tag + aggregate + suggest (all server-side, no autonomous outbound actions)
- **Later:** send email digest (high risk, opt-in), trigger n8n webhook (high risk, approval step)
