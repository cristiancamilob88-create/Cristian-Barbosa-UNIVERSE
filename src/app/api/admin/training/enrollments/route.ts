import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getTrainingRoster } from "@/server/admin/training";
import { findOrCreateContactDirect } from "@/server/db/repositories/contact";
import {
  PLAN_DICIEMBRE_PRODUCT_SLUG,
  activateEnrollment,
  getProductIdBySlug,
  upsertPendingEnrollment,
} from "@/server/db/repositories/training";
import { runAfterResponse } from "@/server/afterResponse";
import { sendMemberAccessEmail } from "@/server/notifications/email";

/**
 * /admin/alumnos's data (docs/TRAINING.md). Private, PII-bearing —
 * admin session cookie only, same posture as /api/admin/contacts.
 *
 * GET: the roster. POST: Cristian adds a student by hand (someone who
 * signed up in person, not through the site's form). With a start date
 * the student is approved on the spot — access granted and the
 * "ya puedes entrar" email sent; without one it lands as a pending
 * sign-up like any other.
 */

export async function GET(request: NextRequest) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const rows = await getTrainingRoster(getPool());
  return NextResponse.json({ ok: true, data: rows });
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+()\s-]*$/)
    .optional()
    .default(""),
  goal: z.string().trim().max(300).optional().default(""),
  objective: z.enum(["bajar_peso", "fuerza", "tonificar", "skills", "general", ""]).optional().default(""),
  level: z.enum(["principiante", "intermedio", "avanzado"]).default("principiante"),
  zone: z.string().trim().max(80).optional().default(""),
  startDate: isoDate.optional(),
});

export async function POST(request: NextRequest) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Revisa nombre, correo y teléfono." }, { status: 400 });
  }
  const input = parsed.data;

  try {
    const result = await withTransaction(async (client) => {
      const productId = await getProductIdBySlug(client, PLAN_DICIEMBRE_PRODUCT_SLUG);
      if (!productId) throw new Error(`product ${PLAN_DICIEMBRE_PRODUCT_SLUG} is missing — run the seed`);

      const { contact } = await findOrCreateContactDirect(client, {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
      });
      const enrollment = await upsertPendingEnrollment(client, {
        contactId: contact.id,
        productId,
        goal: input.goal,
        objective: input.objective || null,
        level: input.level,
        zone: input.zone,
      });
      const activated = input.startDate ? await activateEnrollment(client, enrollment.id, input.startDate) : null;
      return { contact, enrollment: activated ?? enrollment };
    });

    if (input.startDate && result.contact.email) {
      const { name, email } = result.contact;
      const startDate = input.startDate;
      runAfterResponse(() => sendMemberAccessEmail({ name, email: email as string, startDate }));
    }

    return NextResponse.json({ ok: true, data: { enrollmentId: result.enrollment.id, status: result.enrollment.status } });
  } catch (err) {
    console.error("[admin-training] failed to create enrollment", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el alumno." }, { status: 500 });
  }
}
