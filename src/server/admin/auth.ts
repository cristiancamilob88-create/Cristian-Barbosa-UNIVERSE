import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/server/env";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/server/auth/session";

/**
 * Authorization for `/api/admin/*` — PII-bearing endpoints, distinct
 * from `requireAnalyticsAuth()` (`src/server/analytics/auth.ts`) on
 * purpose: session cookie ONLY, no `ANALYTICS_API_TOKEN` bearer-token
 * fallback. That token is meant for a future non-browser/automation
 * caller against aggregate data — real names/emails/phones shouldn't be
 * reachable by anything except Cristian's own logged-in browser.
 *
 * Fails closed the same way `requireAnalyticsAuth()` does: unconfigured
 * secret → 503, never an open table.
 */
export function requireAdminApiSession(request: NextRequest): NextResponse | null {
  const { ADMIN_SESSION_SECRET } = getServerEnv();
  if (!ADMIN_SESSION_SECRET) {
    return NextResponse.json({ ok: false, error: "Admin API is not configured." }, { status: 503 });
  }

  if (isValidAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return null;
  }

  return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
}
