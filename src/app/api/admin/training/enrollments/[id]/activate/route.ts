import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withTransaction } from "@/server/db/transaction";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getContactById } from "@/server/db/repositories/contact";
import { activateEnrollment } from "@/server/db/repositories/training";
import { runAfterResponse } from "@/server/afterResponse";
import { sendMemberAccessEmail } from "@/server/notifications/email";

/**
 * Cristian approves a sign-up (docs/TRAINING.md, "Approval"): the
 * enrollment becomes active from `startDate`, the contact gets the
 * program's entitlement, and the "ya puedes entrar" email goes out.
 * Re-running it on an active student just moves their start date.
 */

const activateSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const uuid = z.string().uuid();

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/training/enrollments/[id]/activate">) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "Inscripción no encontrada." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Elige la fecha de inicio." }, { status: 400 });
  }

  try {
    const result = await withTransaction(async (client) => {
      const enrollment = await activateEnrollment(client, id, parsed.data.startDate);
      if (!enrollment) return null;
      const contact = await getContactById(client, enrollment.contactId);
      return { enrollment, contact };
    });
    if (!result) {
      return NextResponse.json({ ok: false, error: "Inscripción no encontrada." }, { status: 404 });
    }

    const email = result.contact?.email;
    if (email) {
      const name = result.contact?.name ?? null;
      runAfterResponse(() => sendMemberAccessEmail({ name, email, startDate: parsed.data.startDate }));
    }

    return NextResponse.json({ ok: true, data: { enrollmentId: result.enrollment.id, status: result.enrollment.status } });
  } catch (err) {
    console.error("[admin-training] failed to activate enrollment", err);
    return NextResponse.json({ ok: false, error: "No se pudo activar." }, { status: 500 });
  }
}
