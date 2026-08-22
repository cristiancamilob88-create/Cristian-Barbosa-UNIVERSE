import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/server/env";

/**
 * Minimal, explicitly-scoped authorization for the private
 * `/api/analytics/*` endpoints — a shared-secret bearer token, not a
 * user authentication system (no login, no sessions, no users table:
 * that's out of scope for this block, and building one just to gate a
 * handful of read-only reporting endpoints would be the wrong tool).
 * See docs/SECURITY.md, "Analytics endpoint authorization" for the full
 * rationale and what replaces this once real accounts exist.
 *
 * Fail-safe: if ANALYTICS_API_TOKEN isn't configured, every request is
 * rejected — there is no "open by default" state.
 *
 * Usage: `const denied = requireAnalyticsAuth(request); if (denied) return denied;`
 */
export function requireAnalyticsAuth(request: NextRequest): NextResponse | null {
  const { ANALYTICS_API_TOKEN } = getServerEnv();
  if (!ANALYTICS_API_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Analytics API is not configured." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || token !== ANALYTICS_API_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
