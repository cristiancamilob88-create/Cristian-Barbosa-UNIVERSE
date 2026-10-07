import "server-only";
import type { Pool, PoolClient } from "pg";
import { grantEntitlement } from "./entitlement";
import {
  parseRoutine,
  type DayLog,
  type EnrollmentLevel,
  type EnrollmentStatus,
  type Routine,
  type WeekLogs,
} from "@/lib/training";

/** The one program that exists today — the product slug seeded in supabase/seed.sql. */
export const PLAN_DICIEMBRE_PRODUCT_SLUG = "plan-diciembre";
/** Every new Plan Diciembre student starts from this template (supabase/seed.sql). */
export const DEFAULT_ROUTINE_TEMPLATE_SLUG = "principiante";

export interface EnrollmentRow {
  id: string;
  contactId: string;
  productId: string;
  status: EnrollmentStatus;
  goal: string | null;
  level: EnrollmentLevel;
  zone: string | null;
  /** YYYY-MM-DD, null until Cristian approves the enrollment. */
  startDate: string | null;
  weeks: number;
  baseRoutine: Routine;
  createdAt: string;
}

export interface RawEnrollmentRow {
  id: string;
  contact_id: string;
  product_id: string;
  status: EnrollmentStatus;
  goal: string | null;
  level: EnrollmentLevel;
  zone: string | null;
  start_date: string | null;
  weeks: number;
  base_routine: unknown;
  created_at: string;
}

// start_date::text, not the bare column: node-postgres turns a `date`
// into a JS Date at local midnight, which shifts a day depending on the
// server's timezone. The text form is exactly the calendar date stored.
export function enrollmentColumns(alias?: string): string {
  const p = alias ? `${alias}.` : "";
  return `${p}id, ${p}contact_id, ${p}product_id, ${p}status, ${p}goal, ${p}level, ${p}zone,
    ${p}start_date::text as start_date, ${p}weeks, ${p}base_routine, ${p}created_at`;
}
const ENROLLMENT_COLUMNS = enrollmentColumns();

export function toEnrollment(row: RawEnrollmentRow): EnrollmentRow {
  return {
    id: row.id,
    contactId: row.contact_id,
    productId: row.product_id,
    status: row.status,
    goal: row.goal,
    level: row.level,
    zone: row.zone,
    startDate: row.start_date,
    weeks: Number(row.weeks),
    baseRoutine: parseRoutine(row.base_routine),
    createdAt: row.created_at,
  };
}

export async function getProductIdBySlug(db: Pool | PoolClient, slug: string): Promise<string | null> {
  const result = await db.query<{ id: string }>("select id from product where slug = $1", [slug]);
  return result.rows[0]?.id ?? null;
}

/**
 * Signs a contact up for a program — status 'pending' until Cristian
 * approves it. The base routine is copied from the template at this
 * moment, so a later edit to the template never silently rewrites an
 * existing student's plan.
 *
 * Idempotent per contact+program: signing up twice keeps the one
 * enrollment (and its status — a second form submission never demotes
 * an active student back to pending); it only fills goal/zone if the
 * new submission brings them.
 */
export async function upsertPendingEnrollment(
  client: PoolClient,
  input: {
    contactId: string;
    productId: string;
    goal?: string | null;
    level?: EnrollmentLevel;
    zone?: string | null;
    templateSlug?: string;
  },
): Promise<EnrollmentRow> {
  const result = await client.query<RawEnrollmentRow>(
    `insert into training_enrollment (contact_id, product_id, goal, level, zone, base_routine)
     values ($1, $2, $3, $4, $5,
             coalesce((select days from routine_template where slug = $6), '[]'::jsonb))
     on conflict (contact_id, product_id) do update set
       goal = coalesce(excluded.goal, training_enrollment.goal),
       zone = coalesce(excluded.zone, training_enrollment.zone),
       updated_at = now()
     returning ${ENROLLMENT_COLUMNS}`,
    [
      input.contactId,
      input.productId,
      input.goal || null,
      input.level ?? "principiante",
      input.zone || null,
      input.templateSlug ?? DEFAULT_ROUTINE_TEMPLATE_SLUG,
    ],
  );
  return toEnrollment(result.rows[0]);
}

/**
 * Cristian's approval: the enrollment becomes active from `startDate`
 * and the contact gets the program's entitlement — the same row
 * `hasEntitlement()` answers for every product, so access to /mi-plan
 * is one grant, not a separate flag to keep in sync. Returns null if
 * the enrollment doesn't exist.
 */
export async function activateEnrollment(
  client: PoolClient,
  enrollmentId: string,
  startDate: string,
): Promise<EnrollmentRow | null> {
  const result = await client.query<RawEnrollmentRow>(
    `update training_enrollment
     set status = 'active', start_date = $2, updated_at = now()
     where id = $1
     returning ${ENROLLMENT_COLUMNS}`,
    [enrollmentId, startDate],
  );
  const row = result.rows[0];
  if (!row) return null;
  await grantEntitlement(client, { contactId: row.contact_id, productId: row.product_id });
  return toEnrollment(row);
}

/**
 * The enrollment a signed-in student sees in /mi-plan: one they have
 * the entitlement for, that has started (active/paused/finished — a
 * finished student can still look back at their plan). Most recent
 * first, for the day a student has run through more than one program.
 */
export async function getMemberEnrollment(db: Pool | PoolClient, contactId: string): Promise<EnrollmentRow | null> {
  const result = await db.query<RawEnrollmentRow>(
    `select ${enrollmentColumns("e")}
     from training_enrollment e
     join entitlement ent on ent.contact_id = e.contact_id and ent.product_id = e.product_id
     where e.contact_id = $1
       and e.status in ('active', 'paused', 'finished')
       and e.start_date is not null
     order by e.start_date desc
     limit 1`,
    [contactId],
  );
  return result.rows[0] ? toEnrollment(result.rows[0]) : null;
}

/** Every week that has its own routine instead of the base one. */
export async function getWeekRoutines(db: Pool | PoolClient, enrollmentId: string): Promise<Record<number, Routine>> {
  const result = await db.query<{ week: number; days: unknown }>(
    "select week, days from training_week_routine where enrollment_id = $1",
    [enrollmentId],
  );
  const byWeek: Record<number, Routine> = {};
  for (const row of result.rows) byWeek[Number(row.week)] = parseRoutine(row.days);
  return byWeek;
}

/** Every day the student has touched, grouped by week. */
export async function getTrainingLogs(db: Pool | PoolClient, enrollmentId: string): Promise<WeekLogs> {
  const result = await db.query<{ week: number; day_index: number; done: boolean[]; note: string | null }>(
    "select week, day_index, done, note from training_log where enrollment_id = $1",
    [enrollmentId],
  );
  const logs: WeekLogs = {};
  for (const row of result.rows) {
    const week = Number(row.week);
    (logs[week] ??= {})[Number(row.day_index)] = { done: row.done, note: row.note };
  }
  return logs;
}

/**
 * Saves one day's check-offs and/or note. Either field may be omitted —
 * a checkbox click only sends `done`, leaving a note typed earlier
 * untouched, and vice versa.
 */
export async function saveDayLog(
  db: Pool | PoolClient,
  input: { enrollmentId: string; week: number; dayIndex: number; done?: boolean[]; note?: string | null },
): Promise<DayLog> {
  const hasDone = input.done !== undefined;
  const hasNote = input.note !== undefined;
  const result = await db.query<{ done: boolean[]; note: string | null }>(
    `insert into training_log (enrollment_id, week, day_index, done, note)
     values ($1, $2, $3, coalesce($4::boolean[], '{}'), $5)
     on conflict (enrollment_id, week, day_index) do update set
       done = case when $6 then excluded.done else training_log.done end,
       note = case when $7 then excluded.note else training_log.note end,
       updated_at = now()
     returning done, note`,
    [
      input.enrollmentId,
      input.week,
      input.dayIndex,
      hasDone ? input.done : null,
      hasNote ? input.note || null : null,
      hasDone,
      hasNote,
    ],
  );
  return result.rows[0];
}
