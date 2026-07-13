// Pure, dependency-free streak computation for check-in history.
//
// A "streak" is consecutive CALENDAR DAYS with at least one check-in, measured
// in the user's LOCAL timezone — a check-in at 11pm and one at 1am the next day
// are two different days to the user, even though they're ~2h apart. Because
// the server can't know the browser's timezone, callers compute this on the
// client and pass the resolved `timeZone` (or omit it to use the host's).
//
// The approach: bucket every timestamp into a local "YYYY-MM-DD" day key, then
// do all consecutive-day math on those keys. Once bucketed, day arithmetic is
// done at UTC noon so daylight-saving shifts can never move a date across a
// midnight boundary.

export interface StreakInfo {
  /** Consecutive days with a check-in, ending today or (if not yet logged) yesterday. */
  current: number;
  /** Longest consecutive run anywhere in the provided history. */
  longest: number;
  /** Whether the user has already checked in on their local "today". */
  loggedToday: boolean;
  /**
   * True when a streak is alive but standing on yesterday — i.e. current > 0
   * and they haven't checked in today yet, so one more check-in keeps it going
   * and skipping today breaks it. Drives the "streak at risk" nudge.
   */
  atRisk: boolean;
}

/** Format a Date as a "YYYY-MM-DD" key in the given timezone (host tz if omitted). */
export function dayKeyOf(date: Date, timeZone?: string): string {
  // en-CA renders as YYYY-MM-DD, which sorts lexicographically as a date.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** The calendar day before a "YYYY-MM-DD" key, as a "YYYY-MM-DD" key. */
export function previousDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  // Anchor at UTC noon so ±1h DST adjustments never cross midnight.
  const noon = Date.UTC(y, m - 1, d, 12);
  const prev = new Date(noon - 24 * 60 * 60 * 1000);
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(prev.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function computeStreak(
  isoTimestamps: string[],
  now: Date = new Date(),
  timeZone?: string,
): StreakInfo {
  const days = new Set<string>();
  for (const iso of isoTimestamps) {
    const t = new Date(iso);
    if (!Number.isNaN(t.getTime())) days.add(dayKeyOf(t, timeZone));
  }

  if (days.size === 0) {
    return { current: 0, longest: 0, loggedToday: false, atRisk: false };
  }

  const todayKey = dayKeyOf(now, timeZone);
  const yesterdayKey = previousDayKey(todayKey);
  const loggedToday = days.has(todayKey);

  // Current streak: anchor on today if logged, else yesterday if logged, else 0.
  let current = 0;
  let cursor: string | null = null;
  if (loggedToday) cursor = todayKey;
  else if (days.has(yesterdayKey)) cursor = yesterdayKey;

  while (cursor && days.has(cursor)) {
    current += 1;
    cursor = previousDayKey(cursor);
  }

  // Longest run anywhere in history: walk the sorted unique day keys.
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    // sorted[i] is later than sorted[i-1]; they're consecutive when the day
    // before sorted[i] is exactly sorted[i-1].
    if (previousDayKey(sorted[i]) === sorted[i - 1]) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  const atRisk = current > 0 && !loggedToday;
  return { current, longest, loggedToday, atRisk };
}
