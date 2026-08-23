import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "./session";

/**
 * The "secure" auth check (docs — Next.js Authentication guide, "Data
 * Access Layer") for Server Components under /admin/(dashboard). Proxy
 * (src/proxy.ts) already does the "optimistic" version of this same
 * check before the route even renders — this is the second, defense-in-
 * depth check the docs recommend never skipping, since Proxy alone
 * "should not be your only line of defense".
 *
 * Call at the top of the protected layout — every nested page inherits
 * the redirect.
 */
export async function requireAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSessionToken(token)) {
    redirect("/admin/login");
  }
}
