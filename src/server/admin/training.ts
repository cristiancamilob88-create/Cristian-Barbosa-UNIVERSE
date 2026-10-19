import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  currentWeek,
  parseRoutine,
  routineForWeek,
  weekCompletion,
  weekStanding,
  type DayLog,
  type EnrollmentLevel,
  type EnrollmentStatus,
  type Routine,
  type WeekStanding,
} from "@/lib/training";

export interface TrainingRosterRow {
  enrollmentId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  programName: string;
  status: EnrollmentStatus;
  level: EnrollmentLevel;
  zone: string | null;
  goal: string | null;
  startDate: string | null;
  weeks: number;
  /** Null until the enrollment has a start date. */
  currentWeek: number | null;
  weekPercent: number | null;
  standing: WeekStanding | null;
  standingLabel: string | null;
  /** The most recently written note in the current week, if any. */
  lastNote: string | null;
  createdAt: string;
}

/**
 * The /admin/alumnos roster — every enrollment with its student's
 * contact detail and how their current week is going. Real PII
 * (name/email/phone), so it lives here with contacts.ts/opportunities.ts,
 * behind `requireAdminApiSession()` only — never under
 * `src/server/analytics/` or `/api/analytics/*` (docs/SECURITY.md).
 *
 * Pending sign-ups first (they're waiting on Cristian), then everyone
 * else, newest first. Three queries total, not one per student: the
 * week routines and logs for every listed enrollment are fetched in bulk
 * and the percentages computed with the same pure functions the student
 * sees (src/lib/training.ts), so the two views can't disagree.
 */
export async function getTrainingRoster(db: Pool | PoolClient, today?: string): Promise<TrainingRosterRow[]> {
  const { rows } = await db.query<{
    enrollment_id: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    program_name: string;
    status: EnrollmentStatus;
    level: EnrollmentLevel;
    zone: string | null;
    goal: string | null;
    start_date: string | null;
    weeks: number;
    base_routine: unknown;
    created_at: string;
  }>(
    `select e.id as enrollment_id,
            c.name as contact_name, c.email::text as contact_email, c.phone as contact_phone,
            p.name as program_name,
            e.status, e.level, e.zone, e.goal, e.start_date::text as start_date, e.weeks, e.base_routine,
            e.created_at
     from training_enrollment e
     join contact c on c.id = e.contact_id
     join product p on p.id = e.product_id
     order by (e.status = 'pending') desc, e.created_at desc
     limit 200`,
  );
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.enrollment_id);
  const [weekRows, logRows] = await Promise.all([
    db.query<{ enrollment_id: string; week: number; days: unknown }>(
      "select enrollment_id, week, days from training_week_routine where enrollment_id = any($1::uuid[])",
      [ids],
    ),
    db.query<{ enrollment_id: string; week: number; day_index: number; done: boolean[]; note: string | null; updated_at: string }>(
      `select enrollment_id, week, day_index, done, note, updated_at
       from training_log where enrollment_id = any($1::uuid[])`,
      [ids],
    ),
  ]);

  const overrides = new Map<string, Record<number, Routine>>();
  for (const r of weekRows.rows) {
    const byWeek = overrides.get(r.enrollment_id) ?? {};
    byWeek[Number(r.week)] = parseRoutine(r.days);
    overrides.set(r.enrollment_id, byWeek);
  }
  const logs = new Map<string, { week: number; dayIndex: number; log: DayLog; updatedAt: string }[]>();
  for (const r of logRows.rows) {
    const list = logs.get(r.enrollment_id) ?? [];
    list.push({ week: Number(r.week), dayIndex: Number(r.day_index), log: { done: r.done, note: r.note }, updatedAt: r.updated_at });
    logs.set(r.enrollment_id, list);
  }

  return rows.map((row) => {
    const base = {
      enrollmentId: row.enrollment_id,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      programName: row.program_name,
      status: row.status,
      level: row.level,
      zone: row.zone,
      goal: row.goal,
      startDate: row.start_date,
      weeks: Number(row.weeks),
      createdAt: row.created_at,
    };
    if (!row.start_date) {
      return { ...base, currentWeek: null, weekPercent: null, standing: null, standingLabel: null, lastNote: null };
    }

    const week = currentWeek(row.start_date, Number(row.weeks), today);
    const weekLogs = (logs.get(row.enrollment_id) ?? []).filter((l) => l.week === week);
    const dayLogs = Object.fromEntries(weekLogs.map((l) => [l.dayIndex, l.log]));
    const routine = routineForWeek(parseRoutine(row.base_routine), overrides.get(row.enrollment_id) ?? {}, week);
    const { percent } = weekCompletion(routine, dayLogs);
    const { standing, label } = weekStanding(percent, weekLogs.length > 0);
    const lastNote =
      weekLogs
        .filter((l) => l.log.note)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]?.log.note ?? null;

    return { ...base, currentWeek: week, weekPercent: percent, standing, standingLabel: label, lastNote };
  });
}
