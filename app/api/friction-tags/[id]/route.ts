import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { aggregatePatterns } from "@/lib/patterns";
import { maybeGenerateSuggestions } from "@/lib/suggestions";
import { logAudit } from "@/lib/audit";

// Correct a check-in's category. The user's choice overwrites `category` (the
// column pattern aggregation reads), while the tagger's original guess is
// preserved in `original_category` the first time a correction is made.
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
  const category = typeof body?.category === "string" ? body.category : "";
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json(
      { error: "Unknown category." },
      { status: 400 },
    );
  }

  // Load the existing tag (owner-scoped) so we know the pre-correction category
  // to preserve and the old category to reconcile in patterns.
  const { data: existing } = await supabase
    .from("friction_tags")
    .select("id, category, original_category")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Tag not found." }, { status: 404 });
  }

  const oldCategory: string | null = existing.category;
  if (oldCategory === category) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const { data: updated, error: updateError } = await supabase
    .from("friction_tags")
    .update({
      category,
      // Keep the model's first guess; don't overwrite it on a second edit.
      original_category: existing.original_category ?? oldCategory,
      category_source: "user-correction",
      category_confidence: 1,
      category_review_status: "corrected",
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Could not update the category." },
      { status: 500 },
    );
  }

  await logAudit(supabase, {
    action: "friction_tag.corrected",
    target_table: "friction_tags",
    target_id: id,
    user_id: userId,
    payload: { from: oldCategory, to: category },
  });

  // Reflect the correction in patterns: recompute the window, then drop the old
  // category's pattern if it no longer has any tags in the window (aggregate
  // only upserts categories that still have tags, so its absence means empty).
  const updatedPatterns = await aggregatePatterns(supabase, userId);
  if (oldCategory && !updatedPatterns.some((p) => p.category === oldCategory)) {
    await supabase
      .from("patterns")
      .delete()
      .eq("user_id", userId)
      .eq("category", oldCategory);
  }
  await maybeGenerateSuggestions(supabase, updatedPatterns, userId);

  return NextResponse.json({ ok: true, frictionTag: updated });
}
