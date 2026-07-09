# Security

## Secret Handling
- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` live only in Vercel environment variables
- Client receives only the Supabase anon key — never the service role key
- All AI calls go through `/api/*` server-side routes; the client never calls OpenAI directly

## Permission Model (v1 → lock-down)
- **v1 demo:** permissive RLS (`using (true)`) on all tables — anyone can read/write, enabling the demo
- **Lock-down sprint:** policies replaced with `auth.uid() = user_id` — each user sees only their own rows
- Agents (named tools) run under the authenticated user's Supabase session; they cannot exceed the user's row-level permissions

## Approved Tools Rule
Only the three named tools in AGENTIC_LAYER.md may call OpenAI. No generic "run any prompt" endpoint exists. New tools require a code review and audit_log integration before deployment.

## Audit Principle
Every meaningful state change (check-in created, tag written, suggestion generated, suggestion ignored) writes an `audit_logs` row server-side. The log is append-only — no update or delete routes exist for audit_logs. If a security or data-loss concern arises that is beyond the builder's expertise, stop and involve a qualified engineer before proceeding.
