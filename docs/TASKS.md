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

**Needs an email provider — code shipped, dormant until the key exists (Stage 13):**
- [x] Weekly digest email via Resend: `lib/digest.ts` builds each opted-in user's top drain + one suggestion (`lib/digest-email.ts` renders the HTML, XSS-escaped) and sends via the Resend API
- [x] Digest opt-in column on `profiles` (`digest_opt_in`, default off, migration 0008); `DigestToggle` on `/account` (PATCH `/api/account/digest`); the send job filters on it
- [x] Scheduled Sunday send via Vercel Cron (`vercel.json` → `/api/cron/weekly-digest`, `0 13 * * 0`), authorized by `CRON_SECRET` (fail-closed)
- **To activate:** add `RESEND_API_KEY` (+ a `DIGEST_FROM_EMAIL` on a Resend-verified domain, and `CRON_SECRET`) to Vercel and redeploy. Until then the opt-in toggle is hidden and the cron reports `skipped`.

**Definition of Done:** A returning user sees their current streak on Home with no email provider configured. Once a provider is set up, a user opted into the digest receives a Sunday email with their top pattern and one suggestion. ✅ (streaks live; digest opt-in + render + cron send-path verified via a throwaway key — only real delivery awaits a live Resend key)

---

## Sprint 6 — Smarter suggestions
**Goal:** Make suggestions feel personal, and let users correct the AI so quality
improves over time.

**Ships without any external account:** ✅ Shipped (Stage 9)
- [x] Tag-correction UI: inline `<select>` on each check-in re-assigns its category → PATCH `/api/friction-tags/[id]`, writes an audit row, and re-aggregates patterns (old category's pattern reconciled away if it empties out)
- [x] Feed corrections back as signal: `category` holds the corrected value (so aggregation reflects truth), the AI's first guess is preserved in a new `original_category` column, and `category_review_status` is set to `'corrected'`
- [x] One-tap "fix?" affordance surfaced prominently on low-confidence ("AI uncertain") tags; a subtle ✎ on confident ones

**Needs an API key — code shipped, dormant until the key exists (Stage 11):**
- [x] Real GPT-4o suggestion generation built as `lib/suggestion-content.ts`: a `generateSuggestionContent(pattern)` with a GPT-4o branch gated on `OPENAI_API_KEY`, falling back to the templates when the key is absent **or** the call fails (same gate pattern as tagging). Malformed LLM output is coerced field-by-field back to the template, so it can never produce worse copy.
- **To activate:** add `OPENAI_API_KEY` to the Vercel env (the same key tagging already wants) and redeploy — no code change. `body_source` flips from `heuristic-fallback` to `openai-gpt-4o`.

**Definition of Done:** A user can re-categorize a check-in and the change persists with an audit row (works today, no key). With `OPENAI_API_KEY` set, a pattern crossing 3 occurrences yields a personalized suggestion; without it, the template still shows. ✅ (no-key path verified end-to-end; coercion unit-tested; LLM path activates on key)

---

## Sprint 7 — Shareable insight (growth loop) ✅ Shipped (Stage 10)
**Goal:** Turn the insight card into an organic acquisition channel. Fully
client-side — no external account, no server round-trip.

- [x] "Share" action on the insight card → renders a branded 1080×1080 PNG (canvas) of the top pattern + hrs/week, in the app's visual language (`lib/share-image.ts`)
- [x] Image generated client-side; a preview is shown in a modal before anything leaves the device
- [x] Download + native share sheet (Web Share API with files, feature-detected; Download-only fallback otherwise)
- [x] Raw check-in text is **excluded by construction** — the renderer only receives the aggregate stat — with an explicit opt-in to add the (template) suggestion headline

**Definition of Done:** From the insight card a user can generate and download/share an image of their top time-drain stat. No raw entry text appears in the image unless the user explicitly opts in. ✅ (verified: rendered PNG shows only category + stat + wordmark)

---

## Sprint 8 — Lower logging friction
**Goal:** Make capturing a frustration faster, and let anonymous visitors try before committing.

**Ships without any external account:** ✅ Shipped (Stage 10)
- [x] Edit a check-in: inline ✎ editor in the friction log → PATCH `/api/check-ins/[id]`; a text change re-tags the entry and re-aggregates patterns (old category pruned via the shared `pruneEmptyCategory` helper)
- [x] Guest → account migration: anonymous home shows a "log your first frustration" form; the entry is stashed in `localStorage` and replayed into the account by `GuestCheckInMigrator` right after signup (claim-then-restore-on-failure so it can't double-submit or be lost)

**Needs an API key — code shipped, dormant until the key exists (Stage 12):**
- [x] Voice input built: `MicButton` (MediaRecorder) → Blob → POST `/api/transcribe` → Whisper (`whisper-1`) → appends to the check-in text field. The mic button only renders, and the route only works, when `OPENAI_API_KEY` is set (same key as tagging/suggestions); otherwise the button is hidden and the route returns 503.
- **To activate:** the same `OPENAI_API_KEY` that lights up tagging & suggestions also lights up voice — add it to Vercel and redeploy, no code change.

**Definition of Done:** Edit an existing check-in and see its tag update. A guest who submits one check-in then signs up keeps it in their new account. With a transcription key, tap 🎤 → speak → text appears in the field. ✅ (edit + guest-migration verified; voice route + mic UI + recording path verified via a throwaway key — only real transcription awaits a live key)

---

# Polish & personalization (Sprints 9–13)

No external accounts or paid services — pure client + the existing Supabase DB.
Sequenced fastest-visible-win first.

## Sprint 9 — Theming & polish
**Goal:** Make it feel crafted, and let users make it theirs.

- [ ] Dark mode: a thin semantic-token layer (ink / surface / subtle / brand / paper / canvas) over the existing colors, keeping **light-mode values identical** (zero light-mode regression); dark values flip via `data-theme` on `<html>`
- [ ] Theme toggle (light / dark / system) in the sidebar + mobile drawer, persisted to `localStorage`, with a no-flash inline script that sets the theme before first paint; respects `prefers-color-scheme` in "system"
- [ ] Micro-interactions: animate friction-log rows in/out; streak-milestone celebration (CSS/canvas confetti at 3/7/30 days); `prefers-reduced-motion` honored
- [ ] Self-built toast notifications (replace inline error text on the main flows)
- [ ] Time-of-day greeting on Home ("Good evening, {name}"); `Cmd/Ctrl+Enter` submits a check-in
- [ ] Accessibility pass: focus-trap on drawer/modals, keyboard nav, ARIA labels

**Definition of Done:** Toggling the theme flips the whole app with no flash on reload; light mode is pixel-unchanged. Reduced-motion users get no animation.

---

## Sprint 10 — Weekly recap ("Your week in review")
**Goal:** The in-app Spotify-Wrapped payoff — and the in-app twin of the (dormant) email digest.

- [ ] `/recap` screen: top 3 drains this week, total hours "reclaimed", current streak, mood trend in words — in the existing Wrapped visual language
- [ ] Reuse the Stage-10 share canvas to produce a shareable recap card
- [ ] Entry point from Home when a week's worth of data exists; graceful empty state otherwise

**Definition of Done:** A user with a week of check-ins sees a recap screen summarizing their week and can share a recap image. No external calls.

---

## Sprint 11 — Custom categories
**Goal:** Let users describe their work in their own words.

- [ ] User-defined categories (new table or JSON on `profiles`), owner-scoped; merged with the built-in set in the correction dropdown
- [ ] Rename / add / archive a category; aggregation already keys on the category string, so patterns/insights follow automatically
- [ ] Note: the heuristic tagger only knows built-in keywords, so custom categories are applied via manual correction until GPT-4o tagging is on

**Definition of Done:** A user can add a custom category, correct a check-in into it, and see it ranked in Patterns. Built-in categories still work.

---

## Sprint 12 — Installable app (PWA) + local reminders
**Goal:** A real home-screen habit tool — no app store, no paid push service.

- [ ] `manifest.json` + icons + a minimal service worker (installable; cached shell for offline *viewing*)
- [ ] Optional daily reminder via the Web Notifications API (on-device, permission-gated) — "time for your check-in?"
- [ ] Reminder time preference stored on the profile / localStorage
- **Caveat:** local notifications are less reliable than real push (need permission, best-effort scheduling) — but zero cost, no external dependency.

**Definition of Done:** The app is installable on mobile and opens offline to a cached shell. A user who grants permission gets a local daily reminder at their chosen time.

---

## Sprint 13 — Control & depth
**Goal:** Trust, findability, and a little more insight from data already collected.

- [ ] Export my data (JSON/CSV download) — pure client, privacy-aligned
- [ ] Search / filter the friction log by category or text
- [ ] Suggestion "Done" / "Snooze" states (the `done` status already exists in the enum — close the UI loop)
- [ ] Time-of-day / day-of-week insight ("You log the most friction on Monday mornings") as a sentence or a lightweight 7-dot week strip — **not** an axis chart (see non-goal below)

**Definition of Done:** A user can export their data, filter their log, mark a suggestion done, and see a plain-language time-of-day insight. No dashboard charts introduced.

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
Sprint 9                                           |--Theming & polish (dark mode)--|
Sprint 10                                                  |--Weekly recap (in-app Wrapped)--|
Sprint 11                                                         |--Custom categories--|
Sprint 12                                                                |--PWA + local reminders--|
Sprint 13                                                                       |--Control & depth--|
```
