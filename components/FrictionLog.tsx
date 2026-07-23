"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CheckInWithTag } from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function FrictionLog({
  checkIns,
  canWrite = true,
}: {
  checkIns: CheckInWithTag[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  if (checkIns.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-6 text-center text-sm text-indigo-deep/60">
        No check-ins yet — what stole your time today?
      </div>
    );
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/check-ins/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(checkIn: CheckInWithTag) {
    setEditingId(checkIn.id);
    setDraft(checkIn.raw_text);
  }

  async function saveEdit(id: string) {
    const text = draft.trim();
    if (!text) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/check-ins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text }),
      });
      if (res.ok) {
        setEditingId(null);
        router.refresh();
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {checkIns.map((checkIn) => {
        const editing = editingId === checkIn.id;
        return (
          <li
            key={checkIn.id}
            className="bg-surface rounded-2xl shadow-sm p-4 flex items-start gap-3"
          >
            <span className="text-xl leading-none">{checkIn.mood}</span>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    autoFocus
                    className="w-full rounded-lg border border-indigo-deep/15 p-2 text-sm text-indigo-deep focus:outline-none focus:ring-2 focus:ring-rose-gold resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(checkIn.id)}
                      disabled={savingId === checkIn.id || !draft.trim()}
                      className="px-3 py-1 rounded-lg bg-brand text-off-white text-xs font-medium hover:bg-brand-light transition disabled:opacity-50"
                    >
                      {savingId === checkIn.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={savingId === checkIn.id}
                      className="px-3 py-1 rounded-lg text-indigo-deep/60 text-xs hover:text-indigo-deep"
                    >
                      Cancel
                    </button>
                    <span className="text-xs text-indigo-deep/40">
                      Editing re-tags this check-in.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-indigo-deep">{checkIn.raw_text}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <CategoryBadge
                      tag={checkIn.friction_tag}
                      editable={canWrite}
                    />
                    <span className="text-xs text-indigo-deep/40">
                      {timeAgo(checkIn.created_at)}
                    </span>
                  </div>
                </>
              )}
            </div>
            {canWrite && !editing && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(checkIn)}
                  aria-label="Edit check-in"
                  title="Edit check-in"
                  className="text-indigo-deep/30 hover:text-indigo-deep text-sm"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(checkIn.id)}
                  disabled={deletingId === checkIn.id}
                  aria-label="Delete check-in"
                  className="text-indigo-deep/30 hover:text-red-500 text-sm disabled:opacity-40"
                >
                  {deletingId === checkIn.id ? "…" : "✕"}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
