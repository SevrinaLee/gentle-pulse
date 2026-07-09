import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const followUpNote =
    typeof body?.follow_up_note === "string" ? body.follow_up_note.trim() : "";

  if (!followUpNote) {
    return NextResponse.json({ error: "Note can't be empty" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: sighEvent, error } = await supabase
    .from("sigh_events")
    .update({ follow_up_note: followUpNote })
    .eq("id", id)
    .select()
    .single();

  if (error || !sighEvent) {
    return NextResponse.json(
      { error: "Could not save your note. Please try again." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "sigh.follow_up_saved",
    target_table: "sigh_events",
    target_id: id,
  });

  return NextResponse.json({ sighEvent }, { status: 200 });
}
