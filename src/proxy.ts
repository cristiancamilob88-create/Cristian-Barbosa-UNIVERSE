import { NextResponse, type NextRequest } from "next/server";
import {
  ATTRIBUTION_MAX_AGE_SECONDS,
  FIRST_TOUCH_COOKIE,
  LAST_TOUCH_COOKIE,
  hasAttributionSignal,
  parseSource,
  serializeSource,
} from "@/lib/attribution";

/**
 * Captures acquisition attribution at the edge, before any page renders.
 *
 * - Runs only when the request URL actually carries a utm_* param, so
 *   plain navigation between pages never re-writes cookies or adds
 *   response latency.
 * - Writes `cb_attr_last` on every attributed visit.
 * - Writes `cb_attr_first` only if it doesn't exist yet — first touch is
 *   permanent for the cookie's lifetime, matching the Contact.firstSource
 *   / lastSource split in src/types/crm.ts.
 */
export function proxy(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  if (!hasAttributionSignal(searchParams)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const referrer = request.headers.get("referer");
  const source = parseSource(searchParams, referrer, pathname);
  const serialized = serializeSource(source);
  const cookieOptions = {
    maxAge: ATTRIBUTION_MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    httpOnly: false,
    path: "/",
  };

  response.cookies.set(LAST_TOUCH_COOKIE, serialized, cookieOptions);
  if (!request.cookies.has(FIRST_TOUCH_COOKIE)) {
    response.cookies.set(FIRST_TOUCH_COOKIE, serialized, cookieOptions);
  }

  return response;
}

export const config = {
  // Skip static assets and Next internals; run on every page/route request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
