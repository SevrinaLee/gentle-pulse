# Tasks & Sprints

## Sprint 1 — Database, seed data & demo shell
**Goal:** The app renders real-looking data for any visitor without login.

- [ ] Run migration SQL (all tables, RLS v1 policies, seed rows)
- [ ] Verify seed check-ins, friction_tags, patterns, suggestions appear via Supabase Studio
- [ ] Build Home screen: mood display, seed check-in list, seed insight card (no interactivity yet)
- [ ] Build Patterns screen: ranked top-frustrations list from seed patterns
- [ ] Implement all five UI states on every screen (loading, empty, partial, error, ready)
- [ ] Deploy to Vercel preview URL

**Definition of Done:** Visiting the preview URL shows the Home screen with ≥ 3 seeded check-ins and one insight card. The Patterns screen shows a ranked list. No login prompt appears.

---

## Sprint 2 — Core check-in engine ✅ v1 functional milestone
**Goal:** A real visitor can submit a frustration and see it tagged in the UI.

- [ ] Check-in form (mood picker + textarea + Submit button) → POST `/api/check-ins` → inserts `check_ins` row
- [ ] API route calls `tag_check_in()` → writes `friction_tags` row; on OpenAI failure, saves entry with review_status `pending` and returns 200
- [ ] Friction log list re-fetches and shows new row with AI tag badge or "Tagging pending" badge
- [ ] Sigh Button (floating 😮‍💨): tap → inserts `sigh_events` row → shows follow-up prompt → saves note
- [ ] `aggregate_patterns()` runs after every new check-in; upserts `patterns`
- [ ] Error banner if network fails on submit
- [ ] Empty state: "No check-ins yet — what stole your time today?"

**Definition of Done:** Submit a check-in → it appears in the list with a category tag within 5 s. Submit with network off → error banner shown, form not cleared.

---

## Sprint 3 — Pattern insight & suggestion drawer
**Goal:** After 5+ check-ins, the user sees a real insight and can read a suggestion.

- [ ] Insight card on Home: shows top pattern category, occurrence count, estimated hours — only when occurrence_count ≥ 3
- [ ] `generate_suggestion()` triggers when a pattern hits ≥ 3 occurrences; writes `suggestions` row
- [ ] "Show Me How" button opens drawer with 4 tabs: ChatGPT Prompt (copy button) / Template / n8n Link / Ignore
- [ ] "Ignore" sets `suggestions.status = 'ignored'` and writes audit_log row
- [ ] Patterns screen: ranked list with estimated hrs/week, no charts, Spotify-Wrapped card style
- [ ] Suggestion card: time_saved badge, difficulty_stars, energy_saved_stars

**Definition of Done:** With 5+ check-ins in DB, the Home screen shows an insight card. Clicking "Show Me How" opens the drawer. Clicking "Ignore" removes the card from view and the DB row shows status `ignored`.

---

## Sprint 4 — Lock it down
**Goal:** Real users' data is private and isolated.

- [ ] Enable Supabase Auth (magic link)
- [ ] Sign-up / log-in page (not the homepage)
- [ ] On sign-up, set `user_id` on all new rows to `auth.uid()`
- [ ] Replace all v1 permissive RLS policies with `auth.uid() = user_id` owner-scoped policies
- [ ] Seed rows assigned to a permanent `demo_user_id` remain publicly readable on the landing/demo page
- [ ] Verify no cross-user data leakage via Supabase RLS tester

**Definition of Done:** Log in as user A, create a check-in. Log in as user B — user A's check-in is not visible. Anonymous visitor still sees demo seed data on the landing page.

---

## Sprint 5 — Voice input & weekly digest
**Goal:** Lower the friction of logging; close the feedback loop via email.

- [ ] Voice capture: MediaRecorder → Blob → POST `/api/transcribe` → Whisper → prefills text field
- [ ] Weekly digest email via Resend: top drain + one suggestion, opt-in toggle in Settings
- [ ] Effort + energy savings score displayed on suggestion cards
- [ ] UI polish: Poppins/Inter fonts, colour token system (Indigo/Rose Gold/Off-White), rounded cards, soft shadows

**Definition of Done:** Tap 🎤, speak, see text appear in the check-in field. User with email opted in receives a digest on Sunday containing their top pattern.

---

## Gantt (sprint → milestone)
```
Sprint 1  |--Demo shell & seed data--|
Sprint 2  |--Core check-in engine (v1 functional)--|
Sprint 3  |--Insight + suggestion drawer--|
Sprint 4  |--Auth + RLS lock-down--|
Sprint 5  |--Voice + email digest--|
```
