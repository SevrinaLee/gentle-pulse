import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const MAX_NAME_LENGTH = 60;

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const displayName =
    typeof body?.display_name === "string" ? body.display_name.trim() : "";

  if (!displayName) {
    return NextResponse.json(
      { error: "Name can't be empty." },
      { status: 400 },
    );
  }
  if (displayName.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: "Could not update your name. Please try again." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "profile.updated",
    target_table: "profiles",
    target_id: userId,
    user_id: userId,
    payload: { display_name: displayName },
  });

  return NextResponse.json({ profile });
}
