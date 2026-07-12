import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  // Same abuse-prevention gate as login: cap rapid email-change requests.
  const rl = checkRateLimit(`email-change:${userId}`, { windowMs: 60_000, max: 3 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  // Supabase sends confirmation link(s) (both old + new address, per
  // double_confirm_changes) rather than changing the email immediately.
  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    return NextResponse.json(
      { error: "Could not start the email change. Please try again." },
      { status: error.status === 429 ? 429 : 500 },
    );
  }

  await logAudit(supabase, {
    action: "profile.email_change_requested",
    target_table: "profiles",
    target_id: userId,
    user_id: userId,
  });

  return NextResponse.json({ ok: true });
}
