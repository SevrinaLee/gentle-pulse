"use client";

import { useEffect, useState } from "react";
import { computeStreak, type StreakInfo } from "@/lib/streak";

// Streaks are measured in the viewer's LOCAL calendar days, which the server
// can't know — so we compute on the client, after mount, from the raw check-in
// timestamps. Computing in an effect (rather than during render) also avoids a
// server/client hydration mismatch on this time-dependent UI. Before the first
// effect runs, and whenever the current streak is 0, the badge renders nothing.
export function StreakBadge({
  timestamps,
  className = "",
}: {
  timestamps: string[];
  className?: string;
}) {
  const [streak, setStreak] = useState<StreakInfo | null>(null);

  useEffect(() => {
    setStreak(computeStreak(timestamps));
  }, [timestamps]);

  if (!streak || streak.current === 0) return null;

  const { current, longest, atRisk } = streak;

  return (
    <div
      className={
        `rounded-2xl px-4 py-3 flex items-center gap-3 ` +
        (atRisk
          ? "bg-rose-gold/10 border border-rose-gold/30"
          : "bg-white shadow-sm") +
        (className ? ` ${className}` : "")
      }
    >
      <span className="text-2xl leading-none" aria-hidden>
        🔥
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-indigo-deep">
          {current}-day streak
        </p>
        {atRisk ? (
          <p className="text-sm text-rose-gold">
            One check-in today keeps it alive.
          </p>
        ) : (
          <p className="text-sm text-indigo-deep/60">
            {longest > current
              ? `Your best is ${longest} ${longest === 1 ? "day" : "days"} — keep going.`
              : "That's your longest streak yet — keep it up."}
          </p>
        )}
      </div>
    </div>
  );
}
