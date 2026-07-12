import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = clientIp(request);

  const rl = checkRateLimit(`forgot-password:${ip}`, { windowMs: 60_000, max: 5 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
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

  const origin = new URL(request.url).origin;
  const supabase = await createClient();

  // Supabase's default email template (custom templates are blocked on this
  // plan) links to its own hosted verify endpoint, which redirects here with
  // the session as a URL hash fragment — see app/reset-password/page.tsx and
  // the note in supabase/config.toml.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Uniform response regardless of whether the email exists — this endpoint
  // must not be usable to enumerate accounts.
  if (error && error.status === 429) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
