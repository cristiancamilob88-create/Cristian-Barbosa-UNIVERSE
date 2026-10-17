import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MEMBER_LOGIN_PATH, MEMBER_SESSION_COOKIE, getMemberContactIdFromToken } from "./memberSession";

/**
 * The "secure" check for /mi-plan Server Components — same two-layer
 * model as /admin (src/server/auth/adminAuth.ts): proxy.ts already
 * bounced a visitor with no valid cookie, this re-verifies the signature
 * inside the render and returns which contact is signed in. Whether that
 * contact still has access is the page's own database read
 * (getMemberEnrollment()), not something the cookie can vouch for.
 */
export async function requireMemberContactId(): Promise<string> {
  const store = await cookies();
  const contactId = getMemberContactIdFromToken(store.get(MEMBER_SESSION_COOKIE)?.value);
  if (!contactId) redirect(MEMBER_LOGIN_PATH);
  return contactId;
}
