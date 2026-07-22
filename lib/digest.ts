import { createClient } from "@supabase/supabase-js";
import { getTopPattern, getActiveSuggestionForPattern } from "./queries";
import { renderDigestEmail } from "./digest-email";

// Weekly digest email. Dormant until RESEND_API_KEY is set (the opt-in toggle
// on /account is likewise hidden until then). The send runs from a Vercel Cron
// endpoint using the service-role key, so it can read every opted-in user's
// data server-side. The pure email renderer lives in ./digest-email.

export interface DigestRunResult {
  skipped?: boolean;
  reason?: string;
  eligible: number;
  sent: number;
  failed: number;
}

async function sendViaResend(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY!;
  const from = process.env.DIGEST_FROM_EMAIL || "Gentle Pulse <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  return res.ok;
}

// Iterate opted-in users, build each digest, and send it. Returns a summary.
// Never throws for a single user's failure — one bad send can't abort the run.
export async function sendDigests(): Promise<DigestRunResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { skipped: true, reason: "Supabase service role not configured", eligible: 0, sent: 0, failed: 0 };
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: optedIn } = await admin
    .from("profiles")
    .select("id, display_name, digest_opt_in")
    .eq("digest_opt_in", true);

  const eligible = optedIn?.length ?? 0;

  if (!process.env.RESEND_API_KEY) {
    return { skipped: true, reason: "RESEND_API_KEY not configured", eligible, sent: 0, failed: 0 };
  }
  if (eligible === 0) {
    return { eligible: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const profile of optedIn!) {
    try {
      const { data: userRes } = await admin.auth.admin.getUserById(profile.id);
      const email = userRes?.user?.email;
      if (!email) { failed++; continue; }

      const topPattern = await getTopPattern(admin, profile.id);
      if (!topPattern) continue; // nothing worth emailing about yet

      const suggestion = await getActiveSuggestionForPattern(
        admin,
        topPattern.id,
        profile.id,
      );

      const { subject, html, text } = renderDigestEmail({
        displayName: profile.display_name || "there",
        category: topPattern.category,
        occurrenceCount: topPattern.occurrence_count,
        hoursPerWeek: topPattern.estimated_hours_per_week,
        suggestionHeadline: suggestion?.headline ?? null,
      });

      const ok = await sendViaResend(email, subject, html, text);
      ok ? sent++ : failed++;
    } catch {
      failed++;
    }
  }

  return { eligible, sent, failed };
}
