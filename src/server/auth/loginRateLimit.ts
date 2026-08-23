import "server-only";

/**
 * In-memory sliding-window rate limit for /admin login attempts — same
 * pattern and same documented limitation as /api/lead's
 * (src/app/api/lead/route.ts): resets on redeploy, doesn't coordinate
 * across instances. Tighter than the lead form's (a single shared
 * admin password is a much higher-value brute-force target than a
 * contact form) — see docs/SECURITY.md.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const attemptLog = new Map<string, number[]>();

export function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (attemptLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  attemptLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_ATTEMPTS;
}

/** Test-only: clears all recorded attempts between test cases. */
export function resetLoginRateLimit(): void {
  attemptLog.clear();
}
