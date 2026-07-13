"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Pattern, Suggestion } from "@/lib/types";
import { SuggestionDrawer } from "./SuggestionDrawer";
import { ShareInsight } from "./ShareInsight";

export function InsightCard({
  pattern,
  suggestion,
  canWrite = true,
}: {
  pattern: Pattern;
  suggestion: Suggestion | null;
  canWrite?: boolean;
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
        <div className="space-y-3">
          <p className="text-sm font-medium text-off-white">
            {suggestion.headline}
          </p>
          <div className="flex gap-2 flex-wrap text-xs">
            {suggestion.time_saved_minutes != null && (
              <span className="px-2 py-1 rounded-full bg-rose-gold/30 text-off-white">
                Saves ~{Math.round(suggestion.time_saved_minutes / 60)}h/wk
              </span>
            )}
            {suggestion.difficulty_stars != null && (
              <span className="px-2 py-1 rounded-full bg-off-white/10 text-off-white/80">
                Difficulty {"★".repeat(suggestion.difficulty_stars)}
                {"☆".repeat(5 - suggestion.difficulty_stars)}
              </span>
            )}
            {suggestion.energy_saved_stars != null && (
              <span className="px-2 py-1 rounded-full bg-off-white/10 text-off-white/80">
                Energy saved {"★".repeat(suggestion.energy_saved_stars)}
                {"☆".repeat(5 - suggestion.energy_saved_stars)}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-gold text-white text-sm font-medium hover:bg-rose-gold/90 transition"
            >
              Show Me How
            </button>
            {canWrite && <ShareInsight pattern={pattern} suggestion={suggestion} />}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-off-white/60">
            No suggestion for this one yet — check back after your next check-in.
          </p>
          {canWrite && <ShareInsight pattern={pattern} suggestion={null} />}
        </div>
      )}

      {open && suggestion && (
        <SuggestionDrawer
          suggestion={suggestion}
          canWrite={canWrite}
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
