import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const supabase = await createClient();

  const { data: sighEvent, error } = await supabase
    .from("sigh_events")
    .insert({})
    .select()
    .single();

  if (error || !sighEvent) {
    return NextResponse.json(
      { error: "Could not log that sigh. Please try again." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "sigh.tapped",
    target_table: "sigh_events",
    target_id: sighEvent.id,
  });

  return NextResponse.json({ sighEvent }, { status: 200 });
}
