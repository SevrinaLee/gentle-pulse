import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { tagCheckIn } from "@/lib/tagging";
import { aggregatePatterns, pruneEmptyCategory } from "@/lib/patterns";
import { maybeGenerateSuggestions } from "@/lib/suggestions";
import { logAudit } from "@/lib/audit";

// Edit a check-in's text and/or mood. When the text changes, the entry is
// re-tagged (a different category means a different pattern), and patterns are
// re-aggregated — with the old category pruned if it emptied out.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawText =
    typeof body?.raw_text === "string" ? body.raw_text.trim() : undefined;
  const mood = typeof body?.mood === "string" ? body.mood : undefined;

  if (rawText !== undefined && !rawText) {
    return NextResponse.json(
      { error: "Tell me what happened — even one word works" },
      { status: 400 },
    );
  }
  if (rawText === undefined && mood === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Owner-scoped fetch of the existing check-in (RLS is the backstop).
  const { data: existing } = await supabase
    .from("check_ins")
    .select("id, raw_text")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Check-in not found." }, { status: 404 });
  }

  const textChanged = rawText !== undefined && rawText !== existing.raw_text;

  const update: Record<string, unknown> = {};
  if (rawText !== undefined) update.raw_text = rawText;
  if (mood !== undefined) update.mood = mood;

  const { error: updateError } = await supabase
    .from("check_ins")
    .update(update)
    .eq("id", id)
    .eq("user_id", userId);
  if (updateError) {
    return NextResponse.json(
      { error: "Could not update this check-in." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "check_in.edited",
    target_table: "check_ins",
    target_id: id,
    user_id: userId,
    payload: { textChanged, moodChanged: mood !== undefined },
  });

  // Only re-tag / re-aggregate when the text actually changed.
  if (textChanged && rawText) {
    // Capture the old category so we can prune its pattern if it empties out.
    const { data: oldTag } = await supabase
      .from("friction_tags")
      .select("id, category")
      .eq("check_in_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    const tag = await tagCheckIn(rawText);

    if (!tag.failed) {
      await supabase
        .from("check_ins")
        .update({
          time_estimate_minutes: tag.time_estimate_minutes,
          time_estimate_source: tag.source,
          time_estimate_confidence: tag.time_estimate_confidence,
          time_estimate_review_status: "unreviewed",
        })
        .eq("id", id)
        .eq("user_id", userId);
    }

    const tagRow = {
      check_in_id: id,
      user_id: userId,
      category: tag.category,
      original_category: null,
      category_source: tag.failed ? null : tag.source,
      category_confidence: tag.category_confidence,
      category_review_status: tag.failed ? "pending" : "unreviewed",
      repeat_flag: tag.repeat_flag,
      repeat_flag_source: tag.failed ? null : tag.source,
      repeat_flag_confidence: tag.repeat_flag_confidence,
      repeat_flag_review_status: tag.failed ? "pending" : "unreviewed",
    };

    if (oldTag) {
      await supabase.from("friction_tags").update(tagRow).eq("id", oldTag.id);
    } else {
      await supabase.from("friction_tags").insert(tagRow);
    }

    const updatedPatterns = await aggregatePatterns(supabase, userId);
    if (oldTag?.category && oldTag.category !== tag.category) {
      await pruneEmptyCategory(
        supabase,
        userId,
        oldTag.category,
        updatedPatterns,
      );
    }
    await maybeGenerateSuggestions(supabase, updatedPatterns, userId);
  }

  return NextResponse.json({ ok: true });
}

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
