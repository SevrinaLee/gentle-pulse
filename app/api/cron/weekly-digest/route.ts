import { NextResponse } from "next/server";
import { sendDigests } from "@/lib/digest";

// Weekly digest cron target. Scheduled in vercel.json; Vercel Cron sends
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in the env.
// We require that match, so the endpoint can't be triggered by anyone else.
// If CRON_SECRET isn't set, the endpoint refuses (fail-closed) rather than
// running unauthenticated.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await sendDigests();
  return NextResponse.json(result);
}
