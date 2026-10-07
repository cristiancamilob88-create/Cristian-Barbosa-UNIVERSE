import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withTransaction } from "@/server/db/transaction";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getEnrollmentById, saveWeekRoutine } from "@/server/db/repositories/training";
import { routineSchema } from "@/lib/training";

/**
 * Cristian writes a student's routine for a week (docs/TRAINING.md,
 * "Personalized routines"). mode "week" changes only that week;
 * "forward" changes that week and every later one while leaving earlier
 * weeks exactly as the student saw them. Admin session only.
 */

const bodySchema = z.object({
  week: z.number().int().min(1).max(52),
  days: routineSchema.min(1),
  mode: z.enum(["week", "forward"]),
});

const uuid = z.string().uuid();

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/training/enrollments/[id]/routine">) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "Alumno no encontrado." }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Revisa la rutina: cada día necesita un nombre y al menos un ejercicio con nombre." },
      { status: 400 },
    );
  }

  try {
    const saved = await withTransaction(async (client) => {
      const enrollment = await getEnrollmentById(client, id);
      if (!enrollment) return "not_found" as const;
      if (parsed.data.week > enrollment.weeks) return "bad_week" as const;
      await saveWeekRoutine(client, { enrollmentId: id, ...parsed.data });
      return "ok" as const;
    });
    if (saved === "not_found") {
      return NextResponse.json({ ok: false, error: "Alumno no encontrado." }, { status: 404 });
    }
    if (saved === "bad_week") {
      return NextResponse.json({ ok: false, error: "Esa semana no existe en su plan." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data: { enrollmentId: id } });
  } catch (err) {
    console.error("[admin-training] failed to save routine", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar la rutina." }, { status: 500 });
  }
}
