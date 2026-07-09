# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) on Vercel
- **Database + Auth:** Supabase (Postgres + RLS)
- **AI:** OpenAI GPT-4o via server-side API route (key never in client)
- **Styling:** Tailwind CSS with custom colour tokens (Deep Indigo / Rose Gold / Off-White)

## What to Build Now vs Later
**Now:** check-in form, AI tagging, pattern aggregation, insight + suggestion card, demo mode.
**Next:** voice input (Whisper), auth + per-user isolation, weekly email digest.
**Later:** SOP drafts, automation builder, integrations (WhatsApp, email, n8n).

## Key User Action — Step-by-Step
1. User types "spent forever replying to DMs" + picks 😩 → hits Submit
2. Next.js API route receives the text
3. GPT-4o returns `{category, time_estimate_minutes, repeat_flag}` with confidence scores
4. Server writes one `check_ins` row + one `friction_tags` row to Supabase
5. Pattern aggregation query runs: counts category occurrences last 7 days → upserts `patterns` row
6. If pattern occurrence_count ≥ 3, GPT-4o drafts a `suggestions` row (stored with review_status)
7. Home screen re-fetches and renders the updated insight card

## Layer Plan
1. **Data first** — schema + RLS before any UI
2. **App logic** — form → API route → DB reads/writes (works without AI)
3. **Smart features** — AI tagging + insight generation layered on top; if OpenAI fails, entry saves untagged and a badge shows "AI tagging pending"
