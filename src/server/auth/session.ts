import "server-only";
import crypto from "node:crypto";
import { getServerEnv } from "@/server/env";

/**
 * Admin session cookie — a stateless, signed token, not a database
 * session. There is exactly one admin (Cristian), so a `session` table
 * with a foreign key to a `users` row would be schema for a concept
 * ("multiple accounts") this block doesn't have — see
 * docs/COMMAND_CENTER.md, "Why a stateless session" for the tradeoffs
 * and what changes when real accounts land.
 *
 * Token shape: `<base64url(JSON payload)>.<base64url(HMAC-SHA256 of that
 * string, keyed by ADMIN_SESSION_SECRET)>` — same idea as a JWT, without
 * pulling in a JWT library for a single fixed claim shape. Payload is
 * deliberately minimal (docs/COMMAND_CENTER.md, "Session payload"): no
 * PII, nothing an attacker could use for anything beyond "is this a
 * currently-valid admin session".
 */
export const ADMIN_SESSION_COOKIE = "cb_admin_session";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h — re-login after, no silent refresh (kept simple on purpose).

interface SessionPayload {
  sub: "admin";
  iat: number;
  exp: number;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

/** Issues a new signed session token, valid for SESSION_TTL_MS from `now`. */
export function createSessionToken(secret: string, now: number = Date.now()): string {
  const payload: SessionPayload = { sub: "admin", iat: now, exp: now + SESSION_TTL_MS };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

/**
 * Verifies a session token's signature and expiry. Pure function — no
 * cookie/env access — so it's directly unit-testable and safe to call
 * from proxy.ts, Route Handlers, and Server Components alike.
 */
export function verifySessionToken(
  token: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): boolean {
  if (!token) return false;
  const separator = token.indexOf(".");
  if (separator <= 0) return false;
  const encodedPayload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload, secret);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  // Constant-time comparison, and only once lengths already match —
  // timingSafeEqual throws on mismatched length instead of returning false.
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    return payload.sub === "admin" && typeof payload.exp === "number" && payload.exp > now;
  } catch {
    return false;
  }
}

/**
 * The one function proxy.ts, requireAnalyticsAuth(), and the admin DAL
 * all call — reads ADMIN_SESSION_SECRET via getServerEnv() (never
 * `process.env` directly, per AGENTS.md) and reports whether a raw
 * cookie value is a currently-valid admin session. Returns `false`
 * (never throws) when the secret isn't configured — fail closed, same
 * posture as requireAnalyticsAuth's own 503.
 */
export function isValidAdminSessionToken(token: string | undefined | null, now: number = Date.now()): boolean {
  const { ADMIN_SESSION_SECRET } = getServerEnv();
  if (!ADMIN_SESSION_SECRET) return false;
  return verifySessionToken(token, ADMIN_SESSION_SECRET, now);
}

/** Cookie options shared by both the login route (set) and logout (delete). */
export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}
