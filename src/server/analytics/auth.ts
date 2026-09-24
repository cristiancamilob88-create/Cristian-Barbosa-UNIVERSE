import "server-only";
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/server/env";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/server/auth/session";

/**
 * Authorization for the private `/api/analytics/*` endpoints — two
 * accepted credentials, checked in this order (docs/COMMAND_CENTER.md,
 * "Analytics endpoint authorization"):
 *
 * 1. The admin session cookie (`cb_admin_session`, src/server/auth/session.ts)
 *    — set by /admin/login, sent automatically by the browser on every
 *    same-origin request. This is what the Command Center dashboard
 *    itself uses; the browser never sees a bearer token.
 * 2. `ANALYTICS_API_TOKEN` as a `Bearer` header — kept as a second,
 *    optional path for a future service-to-service/automation caller
 *    that isn't a logged-in browser session. Block 03's original,
 *    still-valid mechanism, no longer the dashboard's own.
 *
 * Fail-safe: if NEITHER is configured, every request is rejected with
 * 503 — there is no "open by default" state. A configured-but-wrong
 * credential is 401.
 *
 * Usage: `const denied = requireAnalyticsAuth(request); if (denied) return denied;`
 */
export function requireAnalyticsAuth(request: NextRequest): NextResponse | null {
  const { ANALYTICS_API_TOKEN, ADMIN_SESSION_SECRET } = getServerEnv();
  if (!ANALYTICS_API_TOKEN && !ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Analytics API is not configured." },
      { status: 503 },
    );
  }

  if (isValidAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return null;
  }

  if (ANALYTICS_API_TOKEN) {
    const header = request.headers.get("authorization") ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme === "Bearer" && token && tokensMatch(token, ANALYTICS_API_TOKEN)) {
      return null;
    }
  }

  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}

/**
 * Constant-time comparison for the bearer token, so response timing
 * can't be used to guess it a character at a time (same approach
 * src/server/auth/session.ts uses for session signatures).
 */
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
