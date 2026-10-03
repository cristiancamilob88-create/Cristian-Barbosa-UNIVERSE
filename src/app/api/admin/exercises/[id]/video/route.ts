import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPool } from "@/server/db/pool";
import { withTransaction } from "@/server/db/transaction";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getExercise, setExerciseVideoPath } from "@/server/db/repositories/exercise";
import { toPublicExercise } from "@/server/training/exercises";
import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
  createSignedVideoUpload,
  deleteVideo,
  isOwnVideoPath,
  isVideoUploadConfigured,
  newVideoPath,
} from "@/server/storage/exerciseVideos";
import { runAfterResponse } from "@/server/afterResponse";

/**
 * Exercise video upload, in two steps (src/server/storage/exerciseVideos.ts):
 *
 * POST { contentType, size } → { uploadUrl, path }: a signed URL the
 *   admin's browser PUTs the file to, straight into Supabase Storage.
 * PUT { path } → attaches the uploaded file to the exercise (and deletes
 *   the one it replaces). Only a path minted for THIS exercise is accepted.
 * DELETE → removes the uploaded video from the exercise.
 *
 * Admin session only; 503 when Storage isn't configured.
 */

const uuid = z.string().uuid();

const signSchema = z.object({
  contentType: z.enum(ALLOWED_VIDEO_TYPES),
  size: z.number().int().positive().max(MAX_VIDEO_BYTES),
});

const attachSchema = z.object({ path: z.string().min(1).max(300) });

type Ctx = RouteContext<"/api/admin/exercises/[id]/video">;

async function guard(request: NextRequest, ctx: Ctx): Promise<{ id: string } | NextResponse> {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;
  if (!isVideoUploadConfigured()) {
    return NextResponse.json({ ok: false, error: "La subida de videos no está configurada todavía." }, { status: 503 });
  }
  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "Ejercicio no encontrado." }, { status: 404 });
  }
  return { id };
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const guarded = await guard(request, ctx);
  if (guarded instanceof NextResponse) return guarded;

  const parsed = signSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "El video debe ser MP4, MOV o WebM y pesar máximo 50 MB." },
      { status: 400 },
    );
  }
  if (!(await getExercise(getPool(), guarded.id))) {
    return NextResponse.json({ ok: false, error: "Ejercicio no encontrado." }, { status: 404 });
  }

  try {
    const path = newVideoPath(guarded.id, parsed.data.contentType);
    const uploadUrl = await createSignedVideoUpload(path);
    return NextResponse.json({ ok: true, data: { uploadUrl, path } });
  } catch (err) {
    console.error("[exercise-videos] failed to sign upload", err);
    return NextResponse.json({ ok: false, error: "No se pudo preparar la subida. Intenta de nuevo." }, { status: 502 });
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const guarded = await guard(request, ctx);
  if (guarded instanceof NextResponse) return guarded;

  const parsed = attachSchema.safeParse(await readJson(request));
  if (!parsed.success || !isOwnVideoPath(guarded.id, parsed.data.path)) {
    return NextResponse.json({ ok: false, error: "Video inválido." }, { status: 400 });
  }
  return attach(guarded.id, parsed.data.path);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const guarded = await guard(request, ctx);
  if (guarded instanceof NextResponse) return guarded;
  return attach(guarded.id, null);
}

async function attach(id: string, path: string | null) {
  const result = await withTransaction((client) => setExerciseVideoPath(client, id, path));
  if (!result) return NextResponse.json({ ok: false, error: "Ejercicio no encontrado." }, { status: 404 });

  const { previousPath } = result;
  if (previousPath && previousPath !== path) runAfterResponse(() => deleteVideo(previousPath));

  const row = await getExercise(getPool(), id);
  return NextResponse.json({ ok: true, data: row ? toPublicExercise(row) : null });
}
