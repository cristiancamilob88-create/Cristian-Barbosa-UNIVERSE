import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import { DuplicateExerciseNameError, updateExercise } from "@/server/db/repositories/exercise";
import { toPublicExercise } from "@/server/training/exercises";
import { exerciseInputSchema } from "@/lib/exercises";

/** Edit one library entry (/admin/biblioteca). Admin session only. */

const uuid = z.string().uuid();

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/exercises/[id]">) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "Ejercicio no encontrado." }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = exerciseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa el nombre y el grupo." },
      { status: 400 },
    );
  }

  try {
    const row = await updateExercise(getPool(), id, parsed.data);
    if (!row) return NextResponse.json({ ok: false, error: "Ejercicio no encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, data: toPublicExercise(row) });
  } catch (err) {
    if (err instanceof DuplicateExerciseNameError) {
      return NextResponse.json({ ok: false, error: "Ya existe un ejercicio con ese nombre." }, { status: 409 });
    }
    console.error("[exercises] failed to update", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el ejercicio." }, { status: 500 });
  }
}
