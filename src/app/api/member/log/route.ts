import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPool } from "@/server/db/pool";
import { MEMBER_SESSION_COOKIE, getMemberContactIdFromToken } from "@/server/auth/memberSession";
import { getMemberEnrollment, getWeekRoutines, saveDayLog } from "@/server/db/repositories/training";
import { routineForWeek } from "@/lib/training";
import { createRateLimiter } from "@/server/rateLimit";

/**
 * Saves a student's check-offs, results and/or note for one day of one week
 * (/mi-plan's week view calls this on every checkbox and on leaving the
 * note field). The enrollment is always the signed-in contact's own —
 * resolved from the session here, never taken from the request body — so
 * a student can only ever write to their own plan.
 */

const logSchema = z
  .object({
    week: z.number().int().min(1).max(52),
    dayIndex: z.number().int().min(0).max(13),
    done: z.array(z.boolean()).max(20).optional(),
    results: z.array(z.string().trim().max(60)).max(20).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.done !== undefined || v.results !== undefined || v.note !== undefined, { message: "Nothing to save." });

// Per student, not per IP: a whole class ticking boxes on the same gym wifi shouldn't trip it.
const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 120 });

export async function POST(request: NextRequest) {
  const contactId = getMemberContactIdFromToken(request.cookies.get(MEMBER_SESSION_COOKIE)?.value);
  if (!contactId) {
    return NextResponse.json({ ok: false, error: "Tu sesión venció. Entra de nuevo." }, { status: 401 });
  }
  if (limiter.isRateLimited(contactId)) {
    return NextResponse.json({ ok: false, error: "Vas muy rápido. Espera un momento." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
  }
  const { week, dayIndex, done, results, note } = parsed.data;

  try {
    const db = getPool();
    const enrollment = await getMemberEnrollment(db, contactId);
    if (!enrollment) {
      return NextResponse.json({ ok: false, error: "No tienes un plan activo." }, { status: 403 });
    }
    if (week > enrollment.weeks) {
      return NextResponse.json({ ok: false, error: "Esa semana no existe en tu plan." }, { status: 400 });
    }
    const routine = routineForWeek(enrollment.baseRoutine, await getWeekRoutines(db, enrollment.id), week);
    const day = routine[dayIndex];
    if (!day || (done && done.length > day.exercises.length) || (results && results.length > day.exercises.length)) {
      return NextResponse.json({ ok: false, error: "Ese día no existe en tu rutina." }, { status: 400 });
    }

    const saved = await saveDayLog(db, { enrollmentId: enrollment.id, week, dayIndex, done, results, note });
    return NextResponse.json({ ok: true, data: saved });
  } catch (err) {
    console.error("[member-log] failed to save", err);
    return NextResponse.json({ ok: false, error: "No se guardó. Revisa tu conexión." }, { status: 500 });
  }
}
