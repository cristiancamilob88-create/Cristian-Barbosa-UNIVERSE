import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/server/env";
import { verifyPassword } from "./password";
import { createSessionToken } from "./session";
import { isLoginRateLimited } from "./loginRateLimit";

/**
 * The actual login decision logic, pulled out of the `loginAction`
 * Server Action (src/app/admin/login/actions.ts) so it's a plain
 * function testable with vitest — `next/headers`'s `cookies()`/`headers()`
 * throw "called outside a request scope" anywhere but a real Next.js
 * request, which would make the Server Action itself untestable
 * end-to-end without a running server. The Server Action stays a thin
 * wrapper: extract `ip`/`password` from the request, call this, then do
 * the Next-specific cookie/redirect I/O with the result.
 */
export type LoginAttemptResult = { ok: true; token: string } | { ok: false; error: string };

const passwordSchema = z.string().min(1).max(200);

export function attemptLogin(password: unknown, ip: string, now: number = Date.now()): LoginAttemptResult {
  const { ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET } = getServerEnv();
  if (!ADMIN_PASSWORD_HASH || !ADMIN_SESSION_SECRET) {
    return { ok: false, error: "El acceso administrativo no está configurado todavía." };
  }

  if (isLoginRateLimited(ip)) {
    return { ok: false, error: "Demasiados intentos. Espera un minuto e intenta de nuevo." };
  }

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { ok: false, error: "Ingresa una contraseña." };
  }

  if (!verifyPassword(parsed.data, ADMIN_PASSWORD_HASH)) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  return { ok: true, token: createSessionToken(ADMIN_SESSION_SECRET, now) };
}
