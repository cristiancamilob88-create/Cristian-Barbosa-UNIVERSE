import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/server/env";
import { withTransaction } from "@/server/db/transaction";
import { issueLoginCode } from "@/server/db/repositories/memberLoginCode";
import { sendMemberLoginCodeEmail } from "@/server/notifications/email";
import { createVisitorRateLimiter } from "@/server/rateLimit";
import { VISITOR_COOKIE } from "@/lib/attribution";

/**
 * Step 1 of student sign-in (docs/TRAINING.md): email in, 6-digit code
 * out by email.
 *
 * The answer is the same whether or not the email belongs to a student
 * with an active plan — this form must not become a way to check whether
 * someone is training with Cristian. The one exception is a real send
 * failure for an eligible student (Gmail down/unconfigured), which says
 * so, because otherwise they'd wait for a code that's never coming.
 */

const requestSchema = z.object({
  email: z.string().trim().email().max(200),
});

// Per visitor + loose per-IP ceiling (src/server/rateLimit.ts) — many students on
// one carrier IP is normal; the per-code attempt cap is the real brute-force guard.
const limiter = createVisitorRateLimiter({ windowMs: 60_000, perVisitor: 10, perIp: 300 });

const GENERIC_SENT_MESSAGE =
  "Si ese correo tiene un plan activo, te llegó un código de 6 dígitos. Revisa también la carpeta de spam.";

export async function POST(request: NextRequest) {
  if (limiter.isRateLimited(request, VISITOR_COOKIE)) {
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
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Escribe un correo válido." }, { status: 400 });
  }

  try {
    const result = await withTransaction((client) => issueLoginCode(client, parsed.data.email, MEMBER_SESSION_SECRET));

    if (result.status === "issued") {
      const sent = await sendMemberLoginCodeEmail({
        name: result.member.name,
        email: result.member.email,
        code: result.code,
      });
      if (!sent) {
        return NextResponse.json(
          { ok: false, error: "No pudimos enviar el código. Intenta de nuevo en unos minutos o escríbele a Cristian." },
          { status: 502 },
        );
      }
    }

    // "not_eligible" and "cooldown" answer exactly like a real send.
    return NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE });
  } catch (err) {
    console.error("[member-login] failed to issue code", err);
    return NextResponse.json({ ok: false, error: "Algo falló. Intenta de nuevo." }, { status: 500 });
  }
}
