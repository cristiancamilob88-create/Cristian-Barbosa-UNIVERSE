import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { visitorCookieOptions, VISITOR_COOKIE } from "@/lib/attribution";
import { privacyPolicyVersion } from "@/config/legal";
import { getServerEnv } from "@/server/env";
import { withTransaction } from "@/server/db/transaction";
import { resolveVisitorContext } from "@/server/db/visitorContext";
import { resolveInterestId } from "@/server/db/repositories/reference";
import { assignInterest, findOrCreateContact } from "@/server/db/repositories/contact";
import { linkVisitorToContact } from "@/server/db/repositories/visitor";
import { createLead } from "@/server/db/repositories/lead";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { ensureFreeEnrollment } from "@/server/db/repositories/training";
import { issueLoginCode } from "@/server/db/repositories/memberLoginCode";
import { sendMemberLoginCodeEmail } from "@/server/notifications/email";
import { createVisitorRateLimiter } from "@/server/rateLimit";
import { todayInBogota } from "@/lib/training";

/**
 * Free sign-up for the student app (/entrenar/gratis, docs/TRAINING.md
 * "Free tier"): anyone — typically arriving from TikTok — gets an active
 * free enrollment immediately and a 6-digit code by email to get in.
 *
 * Same CRM write path as /api/lead (attribution, find-or-create contact,
 * consent, interest, a `lead` row + `lead_submitted` interaction with
 * topic "app_gratis"), so every free sign-up shows up in /admin with
 * where it came from. Ownership of the email is proven by the code — an
 * account nobody can open costs nothing.
 */

const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  objective: z.enum(["bajar_peso", "fuerza", "tonificar", "skills", "general"]),
  consent: z.literal(true),
  // Honeypot — see /api/lead.
  company: z.string().max(200).optional().default(""),
});

// Per visitor, with a loose per-IP ceiling (src/server/rateLimit.ts): a
// viral TikTok means many phones behind one carrier IP signing up at once.
const limiter = createVisitorRateLimiter({ windowMs: 60_000, perVisitor: 5, perIp: 300 });

const ROUTE = "/entrenar/gratis";

export async function POST(request: NextRequest) {
  if (limiter.isRateLimited(request, VISITOR_COOKIE)) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  }
  const { MEMBER_SESSION_SECRET } = getServerEnv();
  if (!MEMBER_SESSION_SECRET) {
    return NextResponse.json({ ok: false, error: "El registro no está disponible todavía." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Revisa tu nombre, tu correo y acepta el tratamiento de datos." }, { status: 400 });
  }
  if (parsed.data.company) return NextResponse.json({ ok: true });

  const { name, email, objective } = parsed.data;

  try {
    const result = await withTransaction(async (client) => {
      const visitorCtx = await resolveVisitorContext(client, request);
      const { contact, created } = await findOrCreateContact(
        client,
        { email, phone: null, name, consentVersion: privacyPolicyVersion },
        visitorCtx.visitor,
      );
      await linkVisitorToContact(client, visitorCtx.visitorId, contact.id);
      if (created) {
        await recordInteraction(client, {
          visitorId: visitorCtx.visitorId,
          contactId: contact.id,
          eventName: "contact_created",
          route: ROUTE,
          touch: visitorCtx.touch,
        });
      }

      const interestId = await resolveInterestId(client, "training");
      if (interestId) await assignInterest(client, contact.id, interestId);
      const lead = await createLead(client, {
        contactId: contact.id,
        interestId,
        topicRaw: "app_gratis",
        message: null,
        touch: visitorCtx.touch,
      });
      await recordInteraction(client, {
        visitorId: visitorCtx.visitorId,
        contactId: contact.id,
        eventName: "lead_submitted",
        route: ROUTE,
        touch: visitorCtx.touch,
        metadata: { topic: "app_gratis", leadId: lead.id },
      });

      await ensureFreeEnrollment(client, { contactId: contact.id, objective, startDate: todayInBogota() });
      const code = await issueLoginCode(client, email, MEMBER_SESSION_SECRET);

      return { code, visitorId: visitorCtx.visitorId, isNewVisitorId: visitorCtx.isNewVisitorId };
    });

    if (result.code.status === "issued") {
      const sent = await sendMemberLoginCodeEmail({
        name: result.code.member.name,
        email: result.code.member.email,
        code: result.code.code,
      });
      if (!sent) {
        return NextResponse.json(
          { ok: false, error: "Te registramos, pero no pudimos enviar el código. Intenta entrar en unos minutos." },
          { status: 502 },
        );
      }
    }

    const response = NextResponse.json({
      ok: true,
      message: "¡Listo! Te enviamos un código de 6 dígitos a tu correo. Revisa también la carpeta de spam.",
    });
    if (result.isNewVisitorId) response.cookies.set(VISITOR_COOKIE, result.visitorId, visitorCookieOptions);
    return response;
  } catch (err) {
    console.error("[member-signup] failed", err);
    return NextResponse.json({ ok: false, error: "No pudimos registrarte. Intenta de nuevo." }, { status: 500 });
  }
}
