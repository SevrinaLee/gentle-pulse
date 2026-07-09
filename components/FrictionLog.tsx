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

export function FrictionLog({ checkIns }: { checkIns: CheckInWithTag[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (checkIns.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-sm text-indigo-deep/60">
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

  return (
    <ul className="space-y-3">
      {checkIns.map((checkIn) => (
        <li
          key={checkIn.id}
          className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3"
        >
          <span className="text-xl leading-none">{checkIn.mood}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-indigo-deep">{checkIn.raw_text}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <CategoryBadge tag={checkIn.friction_tag} />
              <span className="text-xs text-indigo-deep/40">
                {timeAgo(checkIn.created_at)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(checkIn.id)}
            disabled={deletingId === checkIn.id}
            aria-label="Delete check-in"
            className="text-indigo-deep/30 hover:text-red-500 text-sm shrink-0 disabled:opacity-40"
          >
            {deletingId === checkIn.id ? "…" : "✕"}
          </button>
        </li>
      ))}
    </ul>
  );
}
