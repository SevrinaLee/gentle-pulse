# Intelligence Layer

## Messy Inputs
- Free-text frustration: "Spent forever replying to perfume DMs again"
- Mood emoji: 😩
- Optional voice note (later sprint → Whisper transcript)
- Time of day (implicit from created_at)

## Auto-Structure Schema (per check-in)
```json
{
  "category": "Customer Support",
  "category_confidence": 0.95,
  "time_estimate_minutes": 75,
  "time_estimate_confidence": 0.88,
  "repeat_flag": true,
  "repeat_flag_confidence": 0.92,
  "source": "openai-gpt-4o",
  "review_status": "unreviewed"
}
```

## Events to Track
- `check_in.submitted` — every new entry
- `sigh.tapped` — Sigh Button press
- `pattern.detected` — category crosses occurrence threshold
- `suggestion.generated` — new suggestion row written
- `suggestion.drawer_opened` — user taps "Show Me How"
- `suggestion.ignored` — user picks "Ignore"

## Scoring Rules (v1 — rule-based first)
1. **Repeat score:** occurrence_count in last 7 days × avg time_estimate_minutes → yields `estimated_hours_per_week`
2. **Top drain:** highest estimated_hours_per_week among patterns for that user
3. **Trigger threshold:** generate a suggestion when occurrence_count ≥ 3 for any category
4. Confidence < 0.7 → review_status stays `unreviewed`; surface "AI uncertain" badge in UI

## What Gets Ranked
- Patterns ranked by estimated_hours_per_week descending → drives Pattern screen order
- Suggestions ranked by (time_saved_minutes × energy_saved_stars) descending

## v1 vs Later
- **v1:** GPT-4o tagging per check-in, rule-based aggregation, single top-drain insight
- **Later:** context-switching detection across categories, decision-fatigue scoring, 30-day "Aha" diagnosis
