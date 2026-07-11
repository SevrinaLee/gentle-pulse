/**
 * Minimal in-memory sliding-window rate limiter for the login endpoint
 * (brute-force defense gate). Keyed by client IP.
 *
 * PRODUCTION CAVEAT: in-memory state is per-process and does NOT survive
 * across Vercel serverless instances / cold starts, so it is best-effort in
 * production. Supabase Auth also enforces its own server-side OTP rate limits
 * (configured in supabase/config.toml [auth.rate_limit]) as the durable
 * backstop. For strict multi-instance limiting, swap this for Upstash Redis or
 * a Postgres-backed counter.
 */

type Hit = { count: number; windowStart: number };

const WINDOW_MS = 60_000;
const MAX_HITS = 5;

const buckets = new Map<string, Hit>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  { windowMs = WINDOW_MS, max = MAX_HITS }: { windowMs?: number; max?: number } = {},
): RateLimitResult {
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || now - hit.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, retryAfterSeconds: 0 };
  }

  hit.count += 1;
  if (hit.count > max) {
    const retryAfterSeconds = Math.ceil((hit.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: max - hit.count, retryAfterSeconds: 0 };
}

/** Test-only helper to reset all buckets. */
export function __resetRateLimits() {
  buckets.clear();
}
