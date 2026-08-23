import { NextResponse, type NextRequest } from "next/server";
import {
  ATTRIBUTION_MAX_AGE_SECONDS,
  BASE_COOKIE_OPTIONS,
  FIRST_TOUCH_COOKIE,
  LAST_TOUCH_COOKIE,
  VISITOR_COOKIE,
  hasAttributionSignal,
  parseSource,
  serializeSource,
  visitorCookieOptions,
} from "@/lib/attribution";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/server/auth/session";

const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Three independent jobs, all Node.js-runtime (Proxy defaults to it as
 * of Next.js 16 — see node_modules/next/dist/docs/.../proxy.md,
 * "Runtime"; the first two predate Block 04 and never touched a
 * database, the third only reads a cookie, so nothing here got slower):
 *
 * 1. Assign a `cb_visitor` anonymous id cookie to every visitor that
 *    doesn't have one yet, before anything else runs. This is the join
 *    key every DB-backed route (`/api/lead`, `/api/track`, `/go/[slug]`)
 *    uses to write `interaction`/`visitor` rows — it must exist on the
 *    very first request, attributed or not.
 * 2. Capture acquisition attribution (utm_* and qr params) into first-touch/
 *    last-touch cookies — unchanged from Block 01, only runs when the
 *    request URL actually carries a signal.
 * 3. Optimistic auth gate for /admin/* (docs/COMMAND_CENTER.md,
 *    "Authentication model"): redirect an unauthenticated visitor
 *    straight to /admin/login, and a logged-in admin away from
 *    /admin/login back to the dashboard. "Optimistic" per the Next.js
 *    docs' own term — this only verifies the signed cookie, no database
 *    read; src/server/auth/adminAuth.ts's requireAdminSession() is the
 *    second, "secure" check every protected Server Component still runs.
 *
 * Cookies are httpOnly: no client code reads any of these directly today
 * (server routes read them from the request) — keeping them out of
 * `document.cookie` is free hardening against XSS-driven tampering.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const hasValidSession = isValidAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (pathname === ADMIN_LOGIN_PATH) {
      if (hasValidSession) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } else if (!hasValidSession) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
  }

  const response = NextResponse.next();

  if (!request.cookies.has(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), visitorCookieOptions);
  }

  const { searchParams } = request.nextUrl;
  if (hasAttributionSignal(searchParams)) {
    const referrer = request.headers.get("referer");
    const source = parseSource(searchParams, referrer, pathname);
    const serialized = serializeSource(source);
    const attributionCookieOptions = {
      ...BASE_COOKIE_OPTIONS,
      maxAge: ATTRIBUTION_MAX_AGE_SECONDS,
    };

    response.cookies.set(LAST_TOUCH_COOKIE, serialized, attributionCookieOptions);
    if (!request.cookies.has(FIRST_TOUCH_COOKIE)) {
      response.cookies.set(FIRST_TOUCH_COOKIE, serialized, attributionCookieOptions);
    }
  }

  return response;
}

export const config = {
  // Skip static assets and Next internals; run on every page/route request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
