"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Pattern, Suggestion } from "@/lib/types";
import { SuggestionDrawer } from "./SuggestionDrawer";

export function InsightCard({
  pattern,
  suggestion,
}: {
  pattern: Pattern;
  suggestion: Suggestion | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-indigo-deep text-off-white rounded-2xl p-5 space-y-2">
      <p className="text-xs uppercase tracking-wide text-off-white/60">
        Your biggest drain this week
      </p>
      <h2 className="text-xl font-semibold">{pattern.category}</h2>
      <p className="text-sm text-off-white/80">
        {pattern.occurrence_count} check-ins ·{" "}
        {pattern.estimated_hours_per_week ?? "?"} hrs/week estimated
      </p>

      {suggestion ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 px-4 py-2 rounded-xl bg-rose-gold text-white text-sm font-medium hover:bg-rose-gold/90 transition"
        >
          Show Me How
        </button>
      ) : (
        <p className="text-sm text-off-white/60">Preparing a suggestion…</p>
      )}

      {open && suggestion && (
        <SuggestionDrawer
          suggestion={suggestion}
          onClose={() => setOpen(false)}
          onIgnored={() => {
            setOpen(false);
            setDismissed(true);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
