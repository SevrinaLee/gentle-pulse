import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Transcribe a short voice memo into text to prefill a check-in. Dormant until
// OPENAI_API_KEY is set (Whisper uses the same OpenAI key as tagging/
// suggestions) — the mic button that calls this is only rendered when the key
// is present (see app/page.tsx), and this route also guards defensively.

const MAX_BYTES = 25 * 1024 * 1024; // OpenAI's audio limit

export async function POST(request: Request) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice input isn't available yet." },
      { status: 503 },
    );
  }

  // Transcription calls cost money — cap per-user bursts.
  const rl = checkRateLimit(`transcribe:${userId}`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Slow down a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No audio received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That recording is too long." },
      { status: 413 },
    );
  }

  const openaiForm = new FormData();
  openaiForm.append("file", file, "recording.webm");
  openaiForm.append("model", "whisper-1");

  try {
    const res = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: openaiForm,
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Couldn't transcribe that. Please try again." },
        { status: 502 },
      );
    }
    const json = await res.json();
    return NextResponse.json({ text: typeof json.text === "string" ? json.text : "" });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the transcription service." },
      { status: 502 },
    );
  }
}
