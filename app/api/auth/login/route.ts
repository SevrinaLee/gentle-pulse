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

  // Brute-force defense: cap rapid login attempts per IP.
  const rl = checkRateLimit(`login:${ip}`);
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

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/` },
  });

  // Do not reveal whether the email exists / provider errors — respond
  // uniformly so this endpoint can't be used to enumerate accounts.
  if (error && error.status === 429) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
