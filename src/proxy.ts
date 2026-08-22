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

/**
 * Two independent jobs, both edge-only (no database access — see
 * docs/AUDIENCE_JOURNEY.md for why the actual `visitor`/`interaction`
 * rows are written lazily by Node.js route handlers instead of here):
 *
 * 1. Assign a `cb_visitor` anonymous id cookie to every visitor that
 *    doesn't have one yet, before anything else runs. This is the join
 *    key every DB-backed route (`/api/lead`, `/api/track`, `/go/[slug]`)
 *    uses to write `interaction`/`visitor` rows — it must exist on the
 *    very first request, attributed or not.
 * 2. Capture acquisition attribution (utm_* and qr params) into first-touch/
 *    last-touch cookies — unchanged from Block 01, only runs when the
 *    request URL actually carries a signal.
 *
 * Cookies are httpOnly: no client code reads any of these directly today
 * (server routes read them from the request) — keeping them out of
 * `document.cookie` is free hardening against XSS-driven tampering.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.has(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), visitorCookieOptions);
  }

  const { searchParams, pathname } = request.nextUrl;
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
