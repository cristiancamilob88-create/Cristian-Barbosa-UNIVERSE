import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPool } from "@/server/db/pool";
import { MEMBER_SESSION_COOKIE, getMemberContactIdFromToken } from "@/server/auth/memberSession";
import { addMeasurement, deleteMeasurement, getMemberEnrollment } from "@/server/db/repositories/training";
import { measurementInputSchema } from "@/lib/training";
import { createRateLimiter } from "@/server/rateLimit";

/**
 * A student logs (POST) or removes (DELETE) a max test in "Mi progreso"
 * (docs/TRAINING.md). Always on the signed-in contact's own enrollment —
 * resolved from the session, never from the body.
 */

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

async function memberEnrollmentId(request: NextRequest): Promise<string | NextResponse> {
  const contactId = getMemberContactIdFromToken(request.cookies.get(MEMBER_SESSION_COOKIE)?.value);
  if (!contactId) return NextResponse.json({ ok: false, error: "Tu sesión venció. Entra de nuevo." }, { status: 401 });
  if (limiter.isRateLimited(contactId)) {
    return NextResponse.json({ ok: false, error: "Vas muy rápido. Espera un momento." }, { status: 429 });
  }
  const enrollment = await getMemberEnrollment(getPool(), contactId);
  if (!enrollment) return NextResponse.json({ ok: false, error: "No tienes un plan activo." }, { status: 403 });
  return enrollment.id;
}

export async function POST(request: NextRequest) {
  const enrollmentId = await memberEnrollmentId(request);
  if (enrollmentId instanceof NextResponse) return enrollmentId;

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
  const saved = await addMeasurement(getPool(), enrollmentId, parsed.data);
  return NextResponse.json({ ok: true, data: saved });
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: NextRequest) {
  const enrollmentId = await memberEnrollmentId(request);
  if (enrollmentId instanceof NextResponse) return enrollmentId;

  const parsed = deleteSchema.safeParse({ id: request.nextUrl.searchParams.get("id") });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
  const removed = await deleteMeasurement(getPool(), enrollmentId, parsed.data.id);
  if (!removed) return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
