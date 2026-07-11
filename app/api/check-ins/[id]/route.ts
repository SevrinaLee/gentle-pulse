import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  // RLS also restricts this to the owner; scoping the query keeps it explicit.
  const { error } = await supabase
    .from("check_ins")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Could not delete this check-in." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "check_in.deleted",
    target_table: "check_ins",
    target_id: id,
    user_id: userId,
  });

  return NextResponse.json({ ok: true });
}
