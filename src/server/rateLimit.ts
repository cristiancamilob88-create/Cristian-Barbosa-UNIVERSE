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
export function getRequestIp(request: { headers: Headers }): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Two-tier limit for the routes real visitors hit during a traffic spike
 * (2026-10-07, ahead of a possible viral video): a tight cap per visitor
 * cookie, plus a much looser cap per IP. A per-IP cap alone treats every
 * phone behind one carrier NAT (Claro/Tigo mobile data shares exit IPs)
 * as one client, so a viral spike from Instagram would turn real page
 * views and leads into silent 429s. A request without the visitor cookie
 * (a script; every real page load gets one from src/proxy.ts first)
 * is held to the per-visitor cap on its IP instead.
 */
export function createVisitorRateLimiter(options: {
  windowMs: number;
  perVisitor: number;
  perIp: number;
}): { isRateLimited(request: { headers: Headers; cookies: { get(name: string): { value: string } | undefined } }, visitorCookie: string): boolean; reset(): void } {
  const visitors = createRateLimiter({ windowMs: options.windowMs, maxRequests: options.perVisitor });
  const ips = createRateLimiter({ windowMs: options.windowMs, maxRequests: options.perIp });
  return {
    isRateLimited(request, visitorCookie) {
      const ip = getRequestIp(request);
      const visitor = request.cookies.get(visitorCookie)?.value;
      if (!visitor) return visitors.isRateLimited(`ip:${ip}`);
      // Both always record, so neither tier can be bypassed by the other.
      const visitorLimited = visitors.isRateLimited(`v:${visitor}`);
      const ipLimited = ips.isRateLimited(ip);
      return visitorLimited || ipLimited;
    },
    reset() {
      visitors.reset();
      ips.reset();
    },
  };
}
