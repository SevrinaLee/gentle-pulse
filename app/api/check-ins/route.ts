import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tagCheckIn } from "@/lib/tagging";
import { aggregatePatterns } from "@/lib/patterns";
import { maybeGenerateSuggestions } from "@/lib/suggestions";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawText = typeof body?.raw_text === "string" ? body.raw_text.trim() : "";
  const mood = typeof body?.mood === "string" ? body.mood : null;

  if (!rawText) {
    return NextResponse.json(
      { error: "Tell me what happened — even one word works" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: checkIn, error: insertError } = await supabase
    .from("check_ins")
    .insert({ mood, raw_text: rawText })
    .select()
    .single();

  if (insertError || !checkIn) {
    return NextResponse.json(
      { error: "Could not save your check-in. Please try again." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "check_in.submitted",
    target_table: "check_ins",
    target_id: checkIn.id,
    payload: { mood },
  });

  const tagResult = await tagCheckIn(rawText);

  if (!tagResult.failed) {
    await supabase
      .from("check_ins")
      .update({
        time_estimate_minutes: tagResult.time_estimate_minutes,
        time_estimate_source: tagResult.source,
        time_estimate_confidence: tagResult.time_estimate_confidence,
        time_estimate_review_status: "unreviewed",
      })
      .eq("id", checkIn.id);
  }

  const { data: frictionTag } = await supabase
    .from("friction_tags")
    .insert({
      check_in_id: checkIn.id,
      category: tagResult.category,
      category_source: tagResult.failed ? null : tagResult.source,
      category_confidence: tagResult.category_confidence,
      category_review_status: tagResult.failed ? "pending" : "unreviewed",
      repeat_flag: tagResult.repeat_flag,
      repeat_flag_source: tagResult.failed ? null : tagResult.source,
      repeat_flag_confidence: tagResult.repeat_flag_confidence,
      repeat_flag_review_status: tagResult.failed ? "pending" : "unreviewed",
    })
    .select()
    .single();

  await logAudit(supabase, {
    action: "check_in.tagged",
    target_table: "friction_tags",
    target_id: frictionTag?.id,
    payload: { category: tagResult.category, failed: tagResult.failed },
  });

  if (!tagResult.failed) {
    const updatedPatterns = await aggregatePatterns(supabase);
    await maybeGenerateSuggestions(supabase, updatedPatterns);
  }

  return NextResponse.json({ checkIn, frictionTag }, { status: 200 });
}
