import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";

const USER_DATA_TABLES = [
  "check_ins",
  "friction_tags",
  "sigh_events",
  "patterns",
  "suggestions",
  // Full account erasure removes this user's own audit trail too. This is a
  // deliberate exception to the "audit_logs is append-only" rule (see
  // docs/SECURITY.md) — normal operation has no update/delete route for
  // audit_logs, but a user-requested account deletion must also erase the
  // personal data those rows reference.
  "audit_logs",
];

// Deletes the CALLER's own account only — the target id always comes from
// the caller's own verified session, never from the request body, so this
// endpoint can't be used to delete someone else's account.
export async function POST() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured on this server." },
      { status: 500 },
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  for (const table of USER_DATA_TABLES) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) {
      return NextResponse.json(
        { error: `Could not delete your data (${table}). Please try again.` },
        { status: 500 },
      );
    }
  }

  // Cascades to the profiles row via its FK to auth.users.
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json(
      { error: "Could not delete your account. Please try again." },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
