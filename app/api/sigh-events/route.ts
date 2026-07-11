import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json(
      { error: "Please log in to log a sigh." },
      { status: 401 },
    );
  }

  const { data: sighEvent, error } = await supabase
    .from("sigh_events")
    .insert({ user_id: userId })
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
    user_id: userId,
  });

  return NextResponse.json({ sighEvent }, { status: 200 });
}
