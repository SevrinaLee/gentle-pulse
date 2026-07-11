import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const { data: suggestion, error } = await supabase
    .from("suggestions")
    .update({ status: "ignored" })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !suggestion) {
    return NextResponse.json(
      { error: "Could not update this suggestion." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "suggestion.ignored",
    target_table: "suggestions",
    target_id: id,
    user_id: userId,
  });

  return NextResponse.json({ suggestion }, { status: 200 });
}
