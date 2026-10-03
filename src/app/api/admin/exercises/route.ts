import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import {
  DuplicateExerciseNameError,
  createExercise,
  getVideoStorageUsedBytes,
  listExercises,
} from "@/server/db/repositories/exercise";
import { toPublicExercise } from "@/server/training/exercises";
import { isVideoUploadConfigured } from "@/server/storage/exerciseVideos";
import { exerciseInputSchema } from "@/lib/exercises";

/**
 * The exercise library for /admin/biblioteca (docs/TRAINING.md, "Exercise
 * library"). Admin session only. GET: every entry (inactive too), whether
 * video upload is configured, and how much video storage is used (null
 * where it can't be read). POST: a new entry.
 */

export async function GET(request: NextRequest) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const db = getPool();
  const [rows, storageUsedBytes] = await Promise.all([
    listExercises(db, { activeOnly: false }),
    getVideoStorageUsedBytes(db).catch(() => null),
  ]);
  return NextResponse.json({
    ok: true,
    data: { exercises: rows.map(toPublicExercise), uploadEnabled: isVideoUploadConfigured(), storageUsedBytes },
  });
}

export async function POST(request: NextRequest) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

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
    const row = await createExercise(getPool(), parsed.data);
    return NextResponse.json({ ok: true, data: toPublicExercise(row) });
  } catch (err) {
    if (err instanceof DuplicateExerciseNameError) {
      return NextResponse.json({ ok: false, error: "Ya existe un ejercicio con ese nombre." }, { status: 409 });
    }
    console.error("[exercises] failed to create", err);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el ejercicio." }, { status: 500 });
  }
}
