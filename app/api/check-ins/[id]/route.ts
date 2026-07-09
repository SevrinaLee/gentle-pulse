import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("check_ins").delete().eq("id", id);

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
  });

  return NextResponse.json({ ok: true });
}
