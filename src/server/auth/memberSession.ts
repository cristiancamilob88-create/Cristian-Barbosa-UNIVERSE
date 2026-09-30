import "server-only";
import crypto from "node:crypto";
import { getServerEnv } from "@/server/env";

/**
 * Student session cookie for /mi-plan (training programs, docs/TRAINING.md)
 * — the same stateless, HMAC-signed token design as the admin session
 * (src/server/auth/session.ts, docs/COMMAND_CENTER.md "Why a stateless
 * session"), with two differences that are the whole point of keeping
 * it separate:
 *
 * - its own secret (MEMBER_SESSION_SECRET) and its own `sub: "member"`
 *   claim, so a student token can never pass as an admin one;
 * - it carries WHICH contact is signed in (`cid`), because unlike the
 *   single admin there are many students. That id is the only claim —
 *   no name/email in the cookie. Whether that contact still has access
 *   is checked against the database on every page (getMemberEnrollment()),
 *   not trusted from the token.
 *
 * 60-day lifetime: a student opens this from a phone's home screen a few
 * times a week; asking for a new emailed code every 12h like /admin does
 * would make the app unusable. Revoking access doesn't wait for expiry —
 * it's the entitlement/enrollment check, not the cookie.
 */
export const MEMBER_SESSION_COOKIE = "cb_member_session";

const MEMBER_SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000;

interface MemberSessionPayload {
  sub: "member";
  cid: string;
  iat: number;
  exp: number;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createMemberSessionToken(contactId: string, secret: string, now: number = Date.now()): string {
  const payload: MemberSessionPayload = { sub: "member", cid: contactId, iat: now, exp: now + MEMBER_SESSION_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

/** The signed-in contact's id, or null for a missing/forged/expired token. Pure — no cookie or env access. */
export function readMemberSessionToken(
  token: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): string | null {
  if (!token) return null;
  const separator = token.indexOf(".");
  if (separator <= 0) return null;
  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!signature) return null;

  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(encoded, secret));
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as MemberSessionPayload;
    if (payload.sub !== "member" || typeof payload.cid !== "string" || typeof payload.exp !== "number") return null;
    return payload.exp > now ? payload.cid : null;
  } catch {
    return null;
  }
}

/** Env-aware wrapper for proxy.ts / route handlers / Server Components. Null (never throws) when unconfigured — fail closed. */
export function getMemberContactIdFromToken(token: string | undefined | null, now: number = Date.now()): string | null {
  const { MEMBER_SESSION_SECRET } = getServerEnv();
  if (!MEMBER_SESSION_SECRET) return null;
  return readMemberSessionToken(token, MEMBER_SESSION_SECRET, now);
}

export function memberSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(MEMBER_SESSION_TTL_MS / 1000),
  };
}

export const MEMBER_AREA_PATH = "/mi-plan";
export const MEMBER_LOGIN_PATH = "/mi-plan/entrar";

/**
 * Paths proxy.ts gates for students: /mi-plan and everything under it,
 * except the sign-in page itself and static files (the PWA manifest and
 * icons must load without a session — browsers fetch a manifest without
 * cookies). Kept here, not in memberAuth.ts, so proxy.ts never imports
 * next/headers.
 */
export function isMemberProtectedPath(pathname: string): boolean {
  if (pathname !== MEMBER_AREA_PATH && !pathname.startsWith(`${MEMBER_AREA_PATH}/`)) return false;
  if (pathname === MEMBER_LOGIN_PATH || pathname.startsWith(`${MEMBER_LOGIN_PATH}/`)) return false;
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  return !lastSegment.includes(".");
}
