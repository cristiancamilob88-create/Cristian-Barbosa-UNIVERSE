import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/server/env";
import { privacyPolicyVersion } from "@/config/legal";
import { withTransaction } from "@/server/db/transaction";
import { verifyLoginCode } from "@/server/db/repositories/memberLoginCode";
import { MEMBER_SESSION_COOKIE, createMemberSessionToken, memberSessionCookieOptions } from "@/server/auth/memberSession";
import { createRateLimiter, getRequestIp } from "@/server/rateLimit";

/**
 * Step 2 of student sign-in: email + code in, session cookie out. The
 * per-code attempt cap (memberLoginCode.ts) is the real brute-force
 * guard; this per-IP limit just keeps a script from cycling emails.
 */

const verifySchema = z.object({
  email: z.string().trim().email().max(200),
  code: z.string().trim().regex(/^\d{6}$/),
  consent: z.boolean().optional().default(false),
});

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

export async function POST(request: NextRequest) {
  if (limiter.isRateLimited(getRequestIp(request))) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }

  const { MEMBER_SESSION_SECRET } = getServerEnv();
  if (!MEMBER_SESSION_SECRET) {
    return NextResponse.json({ ok: false, error: "El acceso de alumnos no está configurado todavía." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "El código son 6 números." }, { status: 400 });
  }

  try {
    const result = await withTransaction((client) =>
      verifyLoginCode(
        client,
        { ...parsed.data, consentVersion: privacyPolicyVersion },
        MEMBER_SESSION_SECRET,
      ),
    );

    switch (result.status) {
      case "ok": {
        const response = NextResponse.json({ ok: true });
        response.cookies.set(
          MEMBER_SESSION_COOKIE,
          createMemberSessionToken(result.contactId, MEMBER_SESSION_SECRET),
          memberSessionCookieOptions(),
        );
        return response;
      }
      case "needs_consent":
        return NextResponse.json(
          { ok: false, needsConsent: true, error: "Para entrar, autoriza el tratamiento de tus datos." },
          { status: 400 },
        );
      case "locked":
        return NextResponse.json(
          { ok: false, error: "Demasiados intentos con este código. Pide uno nuevo." },
          { status: 400 },
        );
      default:
        return NextResponse.json(
          { ok: false, error: "Código incorrecto o vencido. Revísalo o pide uno nuevo." },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("[member-login] failed to verify code", err);
    return NextResponse.json({ ok: false, error: "Algo falló. Intenta de nuevo." }, { status: 500 });
  }
}
