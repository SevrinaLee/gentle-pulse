# gentle-pulse

Gentle Pulse is a daily friction-discovery companion that helps solopreneurs log work frustrations via quick check-ins, then uses AI pattern detection to reveal their biggest repetitive time drains and suggest one practical fix.

## ⚠️ READ THIS BEFORE WRITING ANY CODE
A complete, correct plan for this app is already committed in `/docs`. Do **not** start
from the project name, the summary above, or your own assumptions — those will lead you to
build the wrong thing (e.g. a marketing landing page). Open the plan and build from it:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/INTELLIGENCE_LAYER.md`
- `docs/AGENTIC_LAYER.md`
- `docs/SECURITY.md`
- `docs/TASKS.md`
- `docs/TEST_PLAN.md`

## Build rules (binding — follow in order)
1. **Read first:** open `docs/PRD.md`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, and
   `docs/TASKS.md` before writing a single line.
2. **Confirm the plan** back to me in 2–3 lines (the core objects + the one main workflow) BEFORE coding.
3. **Build the ONE core engine/verb FIRST, working end-to-end.** Every app has a main action —
   create a proposal, run the quote/simulation, log a change and act on it. Build THAT against the
   real database in Sprint 1, then breadth. Then build straight through the sprints until the app
   actually WORKS end-to-end. Do NOT stop after auth + an empty or "Connected" status dashboard, and
   do NOT ship read-only screens of seeded data — **every button and form must persist to the
   database and the UI must reflect it. NO dead buttons. Seeded rows are demo placeholders the user
   can also create/edit/delete.** Commit + push after each sprint; pause for review only once a real
   person can actually perform the core job.
4. **Database-first, but don't stop at the database:** lay the data model + core CRUD first (the
   core must work with the AI switched off), then build the real screens that make it usable.
5. **This is the real working app** — real forms, lists, detail views, and the end-to-end flow from
   the PRD's success scenario. Do **NOT** build a marketing/landing page, a front-end-only demo, or
   a connection-status dashboard.
6. **Demo-first — no login wall in v1.** The homepage IS the working app (with seed data), reachable by
   anyone — do NOT redirect to /login or gate the app behind auth yet. Login/signup + per-user lockdown
   is a LATER "Lock it down" sprint, before real users/data. (Keeps the app demoable + screenshot-able.)
7. Never put secrets in frontend code.

## DevSecOps (binding — security verification gates)
Always implement security development related to coding, authentication and data. Before
declaring any coding task complete, write and **execute** automated tests that verify the four
gates below, then report detailed results — only after ALL verification tests have run.

1. **Data Isolation** — assert User A gets a 403/404 when requesting User B's data.
2. **SQL Injection Prevention** — inject raw payloads (e.g. `' OR '1'='1`) into every endpoint
   and assert they fail safely (stored as inert text or rejected; never executed).
3. **Brute-Force Defenses** — simulate rapid repeated requests and assert rate-limiting triggers.
4. **Data Exfiltration Prevention** — verify no bulk data dumps and no unintended fields
   (secrets, other users' rows, internal columns) leak from any endpoint or client bundle.

**How these gates map to THIS project** (v1 is deliberately demo-first — see rule 6 above and
`docs/SECURITY.md` — so the gates phase in rather than contradict the plan):

- **Applies NOW (every sprint):**
  - Gate 2 (SQL injection): all DB access goes through Supabase PostgREST (parameterized —
    never introduce raw SQL string concatenation). Tests must still prove hostile payloads
    through `/api/check-ins`, `/api/sigh-events/*`, `/api/suggestions/*` are stored/rejected
    safely.
  - Gate 4 (partial): API responses must return only intended fields; `SUPABASE_SERVICE_ROLE_KEY`
    and `OPENAI_API_KEY` stay server-side only; nothing beyond the anon key ships in the client
    bundle. (Bulk reads of demo seed data via the anon key are *intentional* in v1.)
  - Gate 3 (partial): public write endpoints currently have NO rate limiting — known gap; add
    abuse throttling on writes when touching those routes.
- **Blocking gates for Sprint 4 "Lock it down"** (auth + owner-scoped RLS). Sprint 4 is NOT done
  until these tests pass:
  - Gate 1: user A's rows return 403/404/empty to user B and to anonymous callers (except
    `demo_user_id` seed rows, which stay publicly readable per `docs/TASKS.md`).
  - Gate 3: rapid login/magic-link attempts trigger rate limiting.
  - Gate 4 (full): bulk cross-user reads via the anon key fail once owner-scoped RLS replaces
    the permissive v1 policies.

Never weaken a passing security test to make a feature ship. If a gate can't be met, stop and
report it instead of completing silently.

## Deploy & data (binding — this stack is already provisioned)
- **Deploy by git, never by CLI.** `git add -A && git commit -m "…" && git push` to `main`;
  Vercel auto-deploys from GitHub. Do NOT run `vercel deploy` / `vercel --prod` with local
  files — it desyncs git, and the next push silently overwrites your live app.
- **Commit + push every change.** Git is the source of truth; uncommitted work is lost on
  the next deploy.
- **The Supabase database is already provisioned** and its keys are in this project's Vercel
  env. Pull them locally: `vercel link` then `vercel env pull .env.local`. Don't invent new ones.
- **Your database is already set up.** The schema from your data model has been applied to
  this project's Supabase database and committed at `supabase/migrations/0001_init.sql`. Build on
  the existing tables — **do not recreate them**. To change the schema, add a NEW migration file
  (`supabase/migrations/0002_*.sql`) and apply it; never edit `0001`.
- **Commit as your GitHub identity, or Vercel will block the deploy.** Vercel verifies that
  every commit's author email belongs to your GitHub account. Your machine's default git email
  often isn't, so the very first local commit gets rejected. Pin this repo's identity once
  (already correct for your account) — before your first commit:
  ```
  git config user.email "242732455+SevrinaLee@users.noreply.github.com"
  git config user.name "SevrinaLee"
  ```

Kickoff prompt: "Read everything in /docs, confirm the plan in 3 lines, then build straight
through the sprints until the app actually works end-to-end — the PRD's success scenario, not
just auth + an empty dashboard. The schema is already applied, so pull env with vercel env pull
and build on the existing tables; commit + push after each sprint to deploy. Stop only when a
real user can do the core job."
