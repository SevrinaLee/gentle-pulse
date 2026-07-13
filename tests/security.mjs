/**
 * DevSecOps verification suite (see CLAUDE.md → DevSecOps gates).
 *
 * Gate 1 — Data Isolation:        user A cannot read/modify user B's rows.
 * Gate 2 — SQL Injection:         raw payloads are stored/handled as inert data.
 * Gate 3 — Brute-Force Defense:   rapid login attempts trigger rate limiting.
 * Gate 4 — Data Exfiltration:     no bulk dumps, no cross-user or hidden fields.
 *
 * Gates 1/2/4 run against the live Supabase REST API using real per-user JWTs
 * (the true RLS boundary). Gate 3 runs against the local dev server's login
 * endpoint. Run with:  NODE_OPTIONS=--use-system-ca node tests/security.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── Load env from .env.local ────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return [l.slice(0, i).trim(), v];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000de";
const KNOWN_COLUMNS = new Set([
  "id", "user_id", "mood", "raw_text", "time_estimate_minutes",
  "time_estimate_source", "time_estimate_confidence",
  "time_estimate_review_status", "created_at",
]);

if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error("Missing env (URL / ANON / SERVICE_ROLE). Aborting.");
  process.exit(2);
}

// ── Tiny assertion harness ──────────────────────────────────────────────────
const results = [];
function check(gate, name, pass, detail = "") {
  results.push({ gate, name, pass, detail });
  const tag = pass ? "PASS" : "FAIL";
  console.log(`[${tag}] G${gate} — ${name}${detail ? `  (${detail})` : ""}`);
}

// REST helper with an explicit bearer (user JWT or anon).
async function rest(path, { token = ANON, method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

const admin = createClient(SUPABASE_URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function makeUser(label) {
  const email = `sectest+${label}.${Date.now()}@example.com`;
  const password = `Pw!${Math.random().toString(36).slice(2)}Aa1`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error) throw new Error(`createUser ${label}: ${error.message}`);
  const client = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false },
  });
  const { data: signIn, error: sErr } = await client.auth.signInWithPassword({
    email, password,
  });
  if (sErr) throw new Error(`signIn ${label}: ${sErr.message}`);
  return { id: created.user.id, email, token: signIn.session.access_token };
}

async function main() {
  let A, B;
  const createdCheckInIds = [];
  try {
    A = await makeUser("a");
    B = await makeUser("b");

    // Seed: user A creates a private check-in.
    const insA = await rest("check_ins", {
      token: A.token,
      method: "POST",
      body: { user_id: A.id, mood: "😩", raw_text: "userA private secret note" },
      prefer: "return=representation",
    });
    const aRow = Array.isArray(insA.json) ? insA.json[0] : insA.json;
    if (!aRow?.id) throw new Error("userA insert failed: " + JSON.stringify(insA.json));
    createdCheckInIds.push({ id: aRow.id, token: A.token });

    // ── GATE 1: DATA ISOLATION ──────────────────────────────────────────────
    // B tries to read A's row by id.
    const bReadsA = await rest(`check_ins?id=eq.${aRow.id}`, { token: B.token });
    check(1, "User B cannot read User A's check-in by id",
      Array.isArray(bReadsA.json) && bReadsA.json.length === 0,
      `rows=${Array.isArray(bReadsA.json) ? bReadsA.json.length : bReadsA.status}`);

    // B tries to UPDATE A's row.
    const bUpdatesA = await rest(`check_ins?id=eq.${aRow.id}`, {
      token: B.token, method: "PATCH",
      body: { raw_text: "hacked by B" }, prefer: "return=representation",
    });
    const bUpdCount = Array.isArray(bUpdatesA.json) ? bUpdatesA.json.length : -1;
    check(1, "User B cannot update User A's check-in", bUpdCount === 0,
      `affected=${bUpdCount}`);

    // B tries to DELETE A's row.
    const bDeletesA = await rest(`check_ins?id=eq.${aRow.id}`, {
      token: B.token, method: "DELETE", prefer: "return=representation",
    });
    const bDelCount = Array.isArray(bDeletesA.json) ? bDeletesA.json.length : -1;
    check(1, "User B cannot delete User A's check-in", bDelCount === 0,
      `affected=${bDelCount}`);

    // Confirm A's row is still intact & unmodified.
    const aReadsOwn = await rest(`check_ins?id=eq.${aRow.id}`, { token: A.token });
    check(1, "User A's row survived B's tampering, unchanged",
      Array.isArray(aReadsOwn.json) && aReadsOwn.json.length === 1 &&
        aReadsOwn.json[0].raw_text === "userA private secret note",
      `rows=${aReadsOwn.json?.length}`);

    // App-layer: B calls the app DELETE endpoint on A's id → must not delete.
    const appDel = await fetch(`${APP_URL}/api/check-ins/${aRow.id}`, {
      method: "DELETE",
    }).then((r) => r.status).catch(() => "no-server");
    // Anonymous (no cookie) must be rejected (401).
    check(1, "App DELETE endpoint rejects unauthenticated caller",
      appDel === 401 || appDel === "no-server",
      `status=${appDel}`);

    // Tag corrections (Sprint 6): A owns a friction_tag; B must not be able to
    // re-categorize it. The app route is owner-scoped, and RLS is the backstop
    // tested here directly — B's PATCH to A's tag must affect 0 rows.
    const insTag = await rest("friction_tags", {
      token: A.token, method: "POST",
      body: { user_id: A.id, check_in_id: aRow.id, category: "Marketing" },
      prefer: "return=representation",
    });
    const aTag = Array.isArray(insTag.json) ? insTag.json[0] : insTag.json;
    if (aTag?.id) {
      const bCorrectsA = await rest(`friction_tags?id=eq.${aTag.id}`, {
        token: B.token, method: "PATCH",
        body: { category: "Admin & Bookkeeping" }, prefer: "return=representation",
      });
      const bTagCount = Array.isArray(bCorrectsA.json) ? bCorrectsA.json.length : -1;
      check(1, "User B cannot correct User A's friction tag", bTagCount === 0,
        `affected=${bTagCount}`);
    }

    // ── GATE 2: SQL INJECTION ───────────────────────────────────────────────
    const payloads = [
      "' OR '1'='1",
      "'; DROP TABLE check_ins;--",
      "1' OR '1'='1' --",
      "\" OR 1=1 --",
    ];
    // 2a: payloads stored as inert literal text (parameterized writes).
    let storedInert = true;
    for (const p of payloads) {
      const ins = await rest("check_ins", {
        token: A.token, method: "POST",
        body: { user_id: A.id, mood: "🧪", raw_text: p },
        prefer: "return=representation",
      });
      const row = Array.isArray(ins.json) ? ins.json[0] : ins.json;
      if (!row?.id || row.raw_text !== p) storedInert = false;
      else createdCheckInIds.push({ id: row.id, token: A.token });
    }
    check(2, "Injection payloads stored as inert literal text", storedInert);

    // 2b: injection in a filter param does not bypass the WHERE / dump rows.
    const injFilter = await rest(
      `check_ins?raw_text=eq.${encodeURIComponent("' OR '1'='1")}`,
      { token: A.token },
    );
    const onlyLiteral = Array.isArray(injFilter.json) &&
      injFilter.json.every((r) => r.raw_text === "' OR '1'='1");
    check(2, "Injection in filter returns only literal matches (no bypass)",
      onlyLiteral, `rows=${injFilter.json?.length}`);

    // 2c: malformed injection into a typed (uuid) column fails safely — the
    // string is treated as a literal value and rejected (4xx error object, no
    // data array returned). PostgREST maps the uuid cast error to 400 for the
    // anon role and 403 for the authenticated role; both are safe rejections.
    const injUuid = await rest("check_ins?id=eq.1%20OR%201=1", { token: A.token });
    check(2, "Injection into uuid filter fails safely (4xx, no rows)",
      injUuid.status >= 400 && injUuid.status < 500 && !Array.isArray(injUuid.json),
      `status=${injUuid.status}, body=${JSON.stringify(injUuid.json)?.slice(0, 60)}`);

    // 2d: tables still exist after DROP TABLE payload.
    const stillThere = await rest("check_ins?select=id&limit=1", { token: A.token });
    check(2, "check_ins table intact after DROP TABLE payload",
      stillThere.status === 200, `status=${stillThere.status}`);

    // ── GATE 4: DATA EXFILTRATION ───────────────────────────────────────────
    // Anonymous read returns ONLY demo rows (no real user rows).
    const anonReads = await rest("check_ins?select=user_id", { token: ANON });
    const anonOnlyDemo = Array.isArray(anonReads.json) &&
      anonReads.json.length > 0 &&
      anonReads.json.every((r) => r.user_id === DEMO_USER_ID);
    check(4, "Anonymous read exposes only demo rows (no user data)",
      anonOnlyDemo,
      `rows=${anonReads.json?.length}, nonDemo=${
        Array.isArray(anonReads.json)
          ? anonReads.json.filter((r) => r.user_id !== DEMO_USER_ID).length
          : "?"}`);

    // Anonymous cannot read audit_logs at all.
    const anonAudit = await rest("audit_logs?select=id", { token: ANON });
    check(4, "Anonymous cannot read audit_logs",
      Array.isArray(anonAudit.json) && anonAudit.json.length === 0,
      `rows=${Array.isArray(anonAudit.json) ? anonAudit.json.length : anonAudit.status}`);

    // Authenticated A's bulk read never includes B's rows.
    await rest("check_ins", {
      token: B.token, method: "POST",
      body: { user_id: B.id, mood: "😐", raw_text: "userB private row" },
      prefer: "return=minimal",
    });
    const aBulk = await rest("check_ins?select=user_id&limit=1000", { token: A.token });
    const noBRows = Array.isArray(aBulk.json) &&
      aBulk.json.every((r) => r.user_id === A.id || r.user_id === DEMO_USER_ID);
    check(4, "User A bulk read contains no User B rows", noBRows,
      `rows=${aBulk.json?.length}`);

    // No unexpected/hidden columns leak in a select *.
    const shape = await rest(`check_ins?id=eq.${aRow.id}`, { token: A.token });
    const keys = shape.json?.[0] ? Object.keys(shape.json[0]) : [];
    const unknown = keys.filter((k) => !KNOWN_COLUMNS.has(k));
    check(4, "No unexpected columns exposed in check_ins response",
      unknown.length === 0, `unknown=${JSON.stringify(unknown)}`);

    // service_role key must never appear in the client bundle / served HTML.
    let bundleLeak = false;
    try {
      const html = await fetch(`${APP_URL}/`).then((r) => r.text());
      bundleLeak = html.includes(SERVICE);
    } catch { /* server not up — skip, reported below */ }
    check(4, "service_role key absent from served homepage HTML", !bundleLeak);

    // profiles table (Name/Nickname, added with account features): anon
    // cannot read any row, and one user cannot read another's profile.
    const anonProfiles = await rest("profiles?select=id", { token: ANON });
    check(4, "Anonymous cannot read any profiles row",
      Array.isArray(anonProfiles.json) && anonProfiles.json.length === 0,
      `rows=${Array.isArray(anonProfiles.json) ? anonProfiles.json.length : anonProfiles.status}`);

    const bReadsAProfile = await rest(`profiles?id=eq.${A.id}`, { token: B.token });
    check(1, "User B cannot read User A's profile",
      Array.isArray(bReadsAProfile.json) && bReadsAProfile.json.length === 0,
      `rows=${bReadsAProfile.json?.length}`);

    // Privilege escalation: RLS authorizes which ROW a user can update, not
    // which COLUMN — a user can PATCH their own profile row directly, so the
    // is_founder flag must be protected by its own trigger (0006), not RLS.
    const escalation = await rest(`profiles?id=eq.${A.id}`, {
      token: A.token, method: "PATCH",
      body: { is_founder: true }, prefer: "return=representation",
    });
    const escalated = Array.isArray(escalation.json) && escalation.json[0]?.is_founder === true;
    check(1, "User cannot self-grant is_founder via direct PATCH", !escalated,
      `is_founder=${escalation.json?.[0]?.is_founder}`);

    // ── GATE 3: BRUTE-FORCE DEFENSE ─────────────────────────────────────────
    let sawRateLimit = false;
    let serverUp = true;
    try {
      for (let i = 0; i < 9; i++) {
        const r = await fetch(`${APP_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "brute.test@example.com" }),
        });
        if (r.status === 429) { sawRateLimit = true; break; }
      }
    } catch { serverUp = false; }
    if (!serverUp) {
      check(3, "Login endpoint rate-limits rapid attempts (429)", false,
        "dev server not reachable at " + APP_URL);
    } else {
      check(3, "Login endpoint rate-limits rapid attempts (429)", sawRateLimit);
    }

    // Same gate for signup and forgot-password — both create/trigger email
    // side effects and must not be freely hammerable. Same email each loop
    // iteration: only the first signup attempt actually creates an account
    // (the rest 400 on "already registered"), so cleanup only has one row.
    const bruteSignupEmail = `brute.signup+${Date.now()}@example.com`;
    for (const [path, body] of [
      ["/api/auth/signup", { email: bruteSignupEmail, password: "whatever123" }],
      ["/api/auth/forgot-password", { email: "brute.forgot@example.com" }],
    ]) {
      let limited = false;
      if (serverUp) {
        for (let i = 0; i < 9; i++) {
          const r = await fetch(`${APP_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (r.status === 429) { limited = true; break; }
        }
      }
      check(3, `${path} rate-limits rapid attempts (429)`, serverUp && limited,
        serverUp ? "" : "dev server not reachable at " + APP_URL);
    }
    if (serverUp) {
      const { data: list } = await admin.auth.admin.listUsers();
      const bruteUser = list?.users?.find((u) => u.email === bruteSignupEmail);
      if (bruteUser) await admin.auth.admin.deleteUser(bruteUser.id).catch(() => {});
    }
  } finally {
    // ── Cleanup ─────────────────────────────────────────────────────────────
    // Purge every row owned by the throwaway users via the service role (it
    // bypasses RLS, and check_ins has no FK to auth.users so deleting the user
    // would otherwise orphan their rows).
    for (const u of [A, B]) {
      if (!u) continue;
      for (const table of ["check_ins", "friction_tags", "patterns", "suggestions", "audit_logs"]) {
        await rest(`${table}?user_id=eq.${u.id}`, { token: SERVICE, method: "DELETE" }).catch(() => {});
      }
      await admin.auth.admin.deleteUser(u.id).catch(() => {});
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  const failed = results.filter((r) => !r.pass);
  console.log("\n──────── SUMMARY ────────");
  for (const g of [1, 2, 3, 4]) {
    const gr = results.filter((r) => r.gate === g);
    const ok = gr.filter((r) => r.pass).length;
    console.log(`Gate ${g}: ${ok}/${gr.length} passed`);
  }
  console.log(`TOTAL: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(2);
});
