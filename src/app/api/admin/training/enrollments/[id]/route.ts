import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getStudentWeek } from "@/server/admin/training";
import { updateEnrollmentProfile } from "@/server/db/repositories/training";

/**
 * One student, for /admin/alumnos/[id] (docs/TRAINING.md). Admin session
 * only (PII + the student's own logs).
 *
 * GET ?semana=N: profile + that week's routine + what they logged.
 * PATCH: objective / goal / level / zone.
 */

const uuid = z.string().uuid();

export async function GET(request: NextRequest, ctx: RouteContext<"/api/admin/training/enrollments/[id]">) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "Alumno no encontrado." }, { status: 404 });
  }
  const week = Number(request.nextUrl.searchParams.get("semana")) || undefined;
  const detail = await getStudentWeek(getPool(), id, week);
  if (!detail) {
    return NextResponse.json({ ok: false, error: "Alumno no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: detail });
}

const profileSchema = z.object({
  objective: z.enum(["bajar_peso", "fuerza", "tonificar", "skills", "general", ""]),
  goal: z.string().trim().max(300),
  level: z.enum(["principiante", "intermedio", "avanzado"]),
  zone: z.string().trim().max(80),
});

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/training/enrollments/[id]">) {
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
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
  }

  const { objective, ...rest } = parsed.data;
  const updated = await withTransaction((client) =>
    updateEnrollmentProfile(client, id, { ...rest, objective: objective || null }),
  );
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Alumno no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: { enrollmentId: updated.id } });
}
