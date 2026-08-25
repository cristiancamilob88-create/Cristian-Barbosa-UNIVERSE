import "server-only";

/**
 * Shared in-memory sliding-window rate limiter — the same pattern that
 * used to be copy-pasted independently in src/server/auth/loginRateLimit.ts
 * and src/app/api/lead/route.ts, now factored out so every rate-limited
 * route (login, /api/lead, /api/checkout/[offerSlug], /api/track) shares
 * one implementation instead of drifting apart. Each call site creates
 * its own limiter instance (own Map, own window/threshold) — this only
 * shares the algorithm, not the state, so one route's traffic can never
 * count against another's limit.
 *
 * Documented limitation, unchanged from the original: in-memory state
 * doesn't survive a redeploy and doesn't coordinate across serverless
 * instances — see docs/SECURITY.md. Good enough at this traffic scale;
 * a real fix (Redis/Upstash or similar) is a decision for when it's
 * actually needed, not before.
 */
export interface RateLimiter {
  /** Records this call and returns whether the caller has exceeded the limit. */
  isRateLimited(key: string): boolean;
  /** Test-only: clears all recorded activity. */
  reset(): void;
}

export function createRateLimiter(options: { windowMs: number; maxRequests: number }): RateLimiter {
  const { windowMs, maxRequests } = options;
  const log = new Map<string, number[]>();

  return {
    isRateLimited(key: string): boolean {
      const now = Date.now();
      const timestamps = (log.get(key) ?? []).filter((t) => now - t < windowMs);
      timestamps.push(now);
      log.set(key, timestamps);
      return timestamps.length > maxRequests;
    },
    reset(): void {
      log.clear();
    },
  };
}

/**
 * The IP-extraction convention every rate-limited route already used
 * independently (Vercel/most proxies set x-forwarded-for; the first
 * entry is the original client) — centralized so it can't drift.
 */
export function getRequestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
