"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FrictionTag } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

export function CategoryBadge({
  tag,
  editable = false,
}: {
  tag: FrictionTag | null;
  editable?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  if (!tag) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
        Tagging pending
      </span>
    );
  }

  async function save(category: string) {
    if (!tag || category === tag.category) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/friction-tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <select
          autoFocus
          disabled={saving}
          defaultValue={tag.category ?? "Uncategorized"}
          onChange={(e) => save(e.target.value)}
          aria-label="Choose the correct category"
          className="text-xs px-2 py-1 rounded-full border border-indigo-deep/20 bg-surface text-indigo-deep focus:outline-none focus:ring-2 focus:ring-rose-gold disabled:opacity-50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          aria-label="Cancel"
          className="text-indigo-deep/40 hover:text-indigo-deep text-xs"
        >
          {saving ? "…" : "✕"}
        </button>
        {error && <span className="text-xs text-red-500">try again</span>}
      </span>
    );
  }

  const uncertain = tag.category != null && (tag.category_confidence ?? 1) < 0.7;

  // No category yet (AI failed/pending). Offer a direct "add" affordance when
  // the viewer can write.
  if (!tag.category) {
    return editable ? (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200"
      >
        AI tagging pending · set category
      </button>
    ) : (
      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
        AI tagging pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-rose-gold-light text-indigo-deep">
      {tag.category}
      {editable ? (
        uncertain ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="AI is unsure — pick the right category"
            className="underline decoration-dotted text-indigo-deep/70 hover:text-indigo-deep"
          >
            fix?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Change category"
            title="Change category"
            className="text-indigo-deep/50 hover:text-indigo-deep"
          >
            ✎
          </button>
        )
      ) : (
        uncertain && (
          <span title="AI uncertain about this tag" className="opacity-70">
            ?
          </span>
        )
      )}
    </span>
  );
}
