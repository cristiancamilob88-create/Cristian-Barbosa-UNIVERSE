import "server-only";
import { createRateLimiter } from "@/server/rateLimit";

/**
 * Rate limit for /admin login attempts — tighter than the public forms'
 * (a single shared admin password is a much higher-value brute-force
 * target than a contact form) — see docs/SECURITY.md.
 */
const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

export function isLoginRateLimited(ip: string): boolean {
  return limiter.isRateLimited(ip);
}

/** Test-only: clears all recorded attempts between test cases. */
export function resetLoginRateLimit(): void {
  limiter.reset();
}
