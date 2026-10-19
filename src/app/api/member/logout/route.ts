import { NextResponse } from "next/server";
import { MEMBER_SESSION_COOKIE, memberSessionCookieOptions } from "@/server/auth/memberSession";

/** Clears the student session. POST only, so a link or prefetch can't sign anyone out. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(MEMBER_SESSION_COOKIE, "", { ...memberSessionCookieOptions(), maxAge: 0 });
  return response;
}
