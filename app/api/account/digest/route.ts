import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Toggle the caller's own weekly-digest opt-in. Owner-scoped; RLS is the
// backstop. The preference is stored regardless of whether email delivery is
// configured yet — the send job simply has nothing to send until it is.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.opt_in !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ digest_opt_in: body.opt_in, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Could not save your preference. Please try again." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "profile.digest_opt_in",
    target_table: "profiles",
    target_id: userId,
    user_id: userId,
    payload: { opt_in: body.opt_in },
  });

  return NextResponse.json({ ok: true, opt_in: body.opt_in });
}
