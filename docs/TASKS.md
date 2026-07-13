# Tasks & Sprints

Sprints 1–4 are shipped and live; their blow-by-blow (decisions, bugs, how each
was verified) lives in [BUILD_LOG.md](./BUILD_LOG.md). Sprints 5–8 below are the
planned expansion roadmap, sequenced by leverage-per-effort. Each is independently
shippable, and every dependency on an external account/key is called out so the
parts that need one are separable from the parts that don't.

---

## Sprint 1 — Database, seed data & demo shell ✅ Shipped
**Goal:** The app renders real-looking data for any visitor without login.

- [x] Run migration SQL (all tables, RLS v1 policies, seed rows)
- [x] Verify seed check-ins, friction_tags, patterns, suggestions appear via Supabase Studio
- [x] Build Home screen: mood display, seed check-in list, seed insight card
- [x] Build Patterns screen: ranked top-frustrations list from seed patterns
- [x] Implement all five UI states on every screen (loading, empty, partial, error, ready)
- [x] Deploy to Vercel preview URL

**Definition of Done:** Visiting the URL shows the Home screen with ≥ 3 seeded check-ins and one insight card; Patterns shows a ranked list; no login prompt appears. ✅

---

## Sprint 2 — Core check-in engine ✅ Shipped (v1 functional milestone)
**Goal:** A real visitor can submit a frustration and see it tagged in the UI.

- [x] Check-in form → POST `/api/check-ins` → inserts `check_ins` row
- [x] API route calls `tag_check_in()`; on OpenAI failure, saves with review_status `pending`, returns 200
- [x] Friction log shows new row with AI tag badge or "Tagging pending" badge
- [x] Sigh Button (floating 😮‍💨): tap → `sigh_events` row → follow-up prompt → saves note
- [x] `aggregate_patterns()` runs after every new check-in; upserts `patterns`
- [x] Error banner if network fails on submit; empty state copy

**Definition of Done:** Submit → appears tagged within 5 s. Submit with network off → error banner, form not cleared. ✅ Note: tagging runs on a heuristic engine today; adding `OPENAI_API_KEY` switches it to GPT-4o with no code change.

---

## Sprint 3 — Pattern insight & suggestion drawer ✅ Shipped
**Goal:** After 3+ occurrences in a category, the user sees a real insight and a suggestion.

- [x] Insight card on Home (only when occurrence_count ≥ 3)
- [x] `generate_suggestion()` triggers at ≥ 3 occurrences; writes `suggestions` row
- [x] "Show Me How" drawer: ChatGPT Prompt (copy) / Template / n8n Link / Ignore
- [x] "Ignore" sets `suggestions.status = 'ignored'` + audit_log row
- [x] Patterns screen: ranked list, hrs/week, Spotify-Wrapped card style (no charts)
- [x] Suggestion card: time_saved badge, difficulty_stars, energy_saved_stars

**Definition of Done:** With 3+ occurrences, Home shows an insight card; "Show Me How" opens the drawer; "Ignore" removes the card and sets DB status `ignored`. ✅ Note: suggestion *copy* is still template-based — real LLM generation is Sprint 6.

---

## Sprint 4 — Lock it down ✅ Shipped (auth method changed)
**Goal:** Real users' data is private and isolated.

- [x] Enable Supabase Auth — **shipped as email + password, not magic link** (magic-link email delivery proved unreliable; full reasoning in BUILD_LOG Stage 6)
- [x] Sign-up / log-in page (not the homepage), with "Forgot password?"
- [x] New rows scoped to `auth.uid()`; anonymous falls back to `demo_user_id`
- [x] Owner-scoped `auth.uid() = user_id` RLS on every table (migration 0002)
- [x] Demo seed rows remain publicly readable on the landing page
- [x] Automated DevSecOps suite proves no cross-user leakage — **20/20 passing**

**Definition of Done:** User A's check-in is invisible to user B; anonymous visitor still sees demo data. ✅ Also shipped beyond the original plan (see BUILD_LOG): navigation + mobile drawer, `/account` (profile, email change, delete account), a `profiles` table, and a protected founder-account flag.

---

## Sprint 5 — Retention loop 🎯 Highest leverage
**Goal:** Give users a reason to come back — the single biggest gap today. Nothing
currently pulls a user back after they close the tab.

**Ships without any external account (do these first):** ✅ Shipped
- [x] Streak tracking: consecutive-day check-in streak per user — timezone-aware, computed in the viewer's local calendar days (`lib/streak.ts`, verified against fixtures incl. DST + tz-boundary cases)
- [x] Streak chip on Home + Patterns screen ("🔥 3-day streak"), in the Spotify-Wrapped visual language (`components/StreakBadge.tsx`)
- [x] In-app "streak at risk" nudge ("One check-in today keeps it alive.") when a streak stands on yesterday

**Needs an email provider (land after the above):**
- [ ] Weekly digest email via Resend: top drain + one suggestion
- [ ] Digest opt-in column on `profiles` (default off), toggle on `/account`, respected by the send job
- [ ] Scheduled Sunday-AM send (Vercel Cron or Supabase scheduled function)
- **Depends on:** a real SMTP/email provider configured in Supabase. The default Supabase email service is not production-grade (see BUILD_LOG Stage 6) — this is why signup confirmation and magic links were avoided. Set up Resend (or an equivalent already available to you) before this half.

**Definition of Done:** A returning user sees their current streak on Home with no email provider configured. Once a provider is set up, a user opted into the digest receives a Sunday email with their top pattern and one suggestion.

---

## Sprint 6 — Smarter suggestions
**Goal:** Make suggestions feel personal, and let users correct the AI so quality
improves over time.

**Ships without any external account:**
- [ ] Tag-correction UI: re-assign a miscategorized check-in's category (the DB already carries `review_status`/confidence from Sprint 2) → writes the correction + an audit row
- [ ] Feed corrections back as signal: store `corrected_category`, set `review_status = 'corrected'`
- [ ] One-tap "fix this" affordance on the existing "AI uncertain" (low-confidence) badge

**Needs an API key:**
- [ ] Real GPT-4o suggestion generation: replace template-only copy in `generate_suggestion()` with an LLM call, falling back to the current templates when the key is absent (same gate pattern as tagging)
- **Depends on:** `OPENAI_API_KEY` in Vercel env. Tagging already auto-upgrades with this key; this extends the same key to suggestion copy — no new account beyond what tagging already wants.

**Definition of Done:** A user can re-categorize a check-in and the change persists with an audit row (works today, no key). With `OPENAI_API_KEY` set, a pattern crossing 3 occurrences yields a personalized suggestion; without it, the template still shows.

---

## Sprint 7 — Shareable insight (growth loop)
**Goal:** Turn the insight card into an organic acquisition channel. Fully
client-side — no external account, no server round-trip.

- [ ] "Share my biggest drain" action on the insight card → renders a branded image (canvas or SVG→PNG) of the top pattern + hours/week, in the app's visual language
- [ ] Image generated client-side; a preview is shown before anything leaves the device
- [ ] Download + native share sheet (Web Share API) on mobile
- [ ] Raw check-in text is **excluded by default** — only the aggregate stat is on the card — with an explicit opt-in to include detail

**Definition of Done:** From the insight card a user can generate and download/share an image of their top time-drain stat. No raw entry text appears in the image unless the user explicitly opts in.

---

## Sprint 8 — Lower logging friction
**Goal:** Make capturing a frustration faster, and let anonymous visitors try before committing.

**Ships without any external account:**
- [ ] Edit a check-in: today you can only delete + re-submit. Add inline edit (PATCH `/api/check-ins/[id]`) with re-tagging + re-aggregation
- [ ] Guest → account migration: let an anonymous visitor submit **one** real check-in that migrates into their account on signup (instead of only viewing demo data). On first signup, re-assign that check-in's `user_id` to the new `auth.uid()`, then re-run tagging/aggregation

**Needs an API key:**
- [ ] Voice input: MediaRecorder → Blob → POST `/api/transcribe` → Whisper → prefills the check-in text field
- **Depends on:** a transcription key (OpenAI Whisper or equivalent).

**Definition of Done:** Edit an existing check-in and see its tag update. A guest who submits one check-in then signs up keeps it in their new account. With a transcription key, tap 🎤 → speak → text appears in the field.

---

## Explicitly out of scope (v1 non-goal — do not slide in incrementally)
**Dashboard-style trend charts over time.** The PRD lists dashboard charts as a v1
non-goal; the Patterns screen stays a ranked "Spotify-Wrapped" list, not a charting
surface. It's a natural-sounding ask once retention improves, so it's called out here
on purpose: revisit only via a deliberate scope decision, never as a quiet add-on to a
sprint above.

---

## Gantt (sprint → milestone)
```
Sprint 1  |--Demo shell & seed data--|                                    ✅ shipped
Sprint 2  |--Core check-in engine (v1 functional)--|                      ✅ shipped
Sprint 3  |--Insight + suggestion drawer--|                               ✅ shipped
Sprint 4  |--Auth (email+password) + RLS lock-down--|                     ✅ shipped
Sprint 5           |--Retention: streaks (no dep) + digest (Resend)--|    ← next, highest leverage
Sprint 6                   |--Smarter suggestions: corrections + GPT-4o--|
Sprint 7                           |--Shareable insight (growth loop)--|
Sprint 8                                   |--Voice + edit + guest migration--|
```
