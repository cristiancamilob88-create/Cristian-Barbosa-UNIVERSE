import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import { addMeasurement, getEnrollmentById, listMeasurements } from "@/server/db/repositories/training";
import { measurementInputSchema } from "@/lib/training";

/**
 * A student's max tests for /admin/alumnos/[id]: GET lists them, POST adds
 * one (the tests Cristian takes in class). Admin session only.
 */

const uuid = z.string().uuid();
type Ctx = RouteContext<"/api/admin/training/enrollments/[id]/measurements">;

async function enrollmentIdFrom(request: NextRequest, ctx: Ctx): Promise<string | NextResponse> {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success || !(await getEnrollmentById(getPool(), id))) {
    return NextResponse.json({ ok: false, error: "Alumno no encontrado." }, { status: 404 });
  }
  return id;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const id = await enrollmentIdFrom(request, ctx);
  if (id instanceof NextResponse) return id;
  return NextResponse.json({ ok: true, data: await listMeasurements(getPool(), id) });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const id = await enrollmentIdFrom(request, ctx);
  if (id instanceof NextResponse) return id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = measurementInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, data: await addMeasurement(getPool(), id, parsed.data) });
}
