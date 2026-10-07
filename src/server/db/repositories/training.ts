import "server-only";
import type { Pool, PoolClient } from "pg";
import { grantEntitlement } from "./entitlement";
import {
  parseRoutine,
  type DayLog,
  type EnrollmentLevel,
  type EnrollmentObjective,
  type EnrollmentStatus,
  type Measurement,
  type MeasurementInput,
  type Routine,
  type WeekLogs,
} from "@/lib/training";

/** The one program that exists today — the product slug seeded in supabase/seed.sql. */
export const PLAN_DICIEMBRE_PRODUCT_SLUG = "plan-diciembre";
/** The free tier — anyone who signs up at /entrenar/gratis (supabase/seed.sql, migration 0020). */
export const FREE_PROGRAM_PRODUCT_SLUG = "rutinas-gratis";
/** Every new Plan Diciembre student starts from this template (supabase/seed.sql). */
export const DEFAULT_ROUTINE_TEMPLATE_SLUG = "principiante";

export interface EnrollmentRow {
  id: string;
  contactId: string;
  productId: string;
  status: EnrollmentStatus;
  goal: string | null;
  objective: EnrollmentObjective | null;
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
  objective: EnrollmentObjective | null;
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
  return `${p}id, ${p}contact_id, ${p}product_id, ${p}status, ${p}goal, ${p}objective, ${p}level, ${p}zone,
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
    objective: row.objective,
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
    objective?: EnrollmentObjective | null;
    level?: EnrollmentLevel;
    zone?: string | null;
    templateSlug?: string;
  },
): Promise<EnrollmentRow> {
  const result = await client.query<RawEnrollmentRow>(
    `insert into training_enrollment (contact_id, product_id, goal, level, zone, base_routine, objective)
     values ($1, $2, $3, $4, $5,
             coalesce((select days from routine_template where slug = $6), '[]'::jsonb), $7)
     on conflict (contact_id, product_id) do update set
       goal = coalesce(excluded.goal, training_enrollment.goal),
       zone = coalesce(excluded.zone, training_enrollment.zone),
       objective = coalesce(training_enrollment.objective, excluded.objective),
       updated_at = now()
     returning ${ENROLLMENT_COLUMNS}`,
    [
      input.contactId,
      input.productId,
      input.goal || null,
      input.level ?? "principiante",
      input.zone || null,
      input.templateSlug ?? DEFAULT_ROUTINE_TEMPLATE_SLUG,
      input.objective || null,
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
 * finished student can still look back at their plan). A paid program
 * wins over the free tier; otherwise the most recent one.
 */
export async function getMemberEnrollment(db: Pool | PoolClient, contactId: string): Promise<EnrollmentRow | null> {
  const result = await db.query<RawEnrollmentRow>(
    `select ${enrollmentColumns("e")}
     from training_enrollment e
     join entitlement ent on ent.contact_id = e.contact_id and ent.product_id = e.product_id
     join product p on p.id = e.product_id
     where e.contact_id = $1
       and e.status in ('active', 'paused', 'finished')
       and e.start_date is not null
     -- A paying student who also signed up for the free tier sees their
     -- real plan, never the free routine.
     order by (p.slug = '${FREE_PROGRAM_PRODUCT_SLUG}'), e.start_date desc
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
  const result = await db.query<{
    week: number;
    day_index: number;
    done: boolean[];
    results: string[];
    note: string | null;
    duration_seconds: number | null;
  }>(
    "select week, day_index, done, results, note, duration_seconds from training_log where enrollment_id = $1",
    [enrollmentId],
  );
  const logs: WeekLogs = {};
  for (const row of result.rows) {
    const week = Number(row.week);
    (logs[week] ??= {})[Number(row.day_index)] = {
      done: row.done,
      results: row.results,
      note: row.note,
      durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
    };
  }
  return logs;
}

/**
 * Saves one day's check-offs, results, note and/or timer. Any field may
 * be omitted — a checkbox click only sends `done`, leaving everything
 * else untouched, and vice versa.
 */
export async function saveDayLog(
  db: Pool | PoolClient,
  input: {
    enrollmentId: string;
    week: number;
    dayIndex: number;
    done?: boolean[];
    results?: string[];
    note?: string | null;
    durationSeconds?: number | null;
  },
): Promise<DayLog> {
  const hasDone = input.done !== undefined;
  const hasResults = input.results !== undefined;
  const hasNote = input.note !== undefined;
  const hasDuration = input.durationSeconds !== undefined;
  const result = await db.query<{ done: boolean[]; results: string[]; note: string | null; duration_seconds: number | null }>(
    `insert into training_log (enrollment_id, week, day_index, done, results, note, duration_seconds)
     values ($1, $2, $3, coalesce($4::boolean[], '{}'), coalesce($5::text[], '{}'), $6, $7)
     on conflict (enrollment_id, week, day_index) do update set
       done = case when $8 then excluded.done else training_log.done end,
       results = case when $9 then excluded.results else training_log.results end,
       note = case when $10 then excluded.note else training_log.note end,
       duration_seconds = case when $11 then excluded.duration_seconds else training_log.duration_seconds end,
       updated_at = now()
     returning done, results, note, duration_seconds`,
    [
      input.enrollmentId,
      input.week,
      input.dayIndex,
      hasDone ? input.done : null,
      hasResults ? input.results : null,
      hasNote ? input.note || null : null,
      hasDuration ? input.durationSeconds : null,
      hasDone,
      hasResults,
      hasNote,
      hasDuration,
    ],
  );
  const row = result.rows[0];
  return {
    done: row.done,
    results: row.results,
    note: row.note,
    durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
  };
}

/** One enrollment by id — /admin's student page. */
export async function getEnrollmentById(db: Pool | PoolClient, enrollmentId: string): Promise<EnrollmentRow | null> {
  const result = await db.query<RawEnrollmentRow>(`select ${ENROLLMENT_COLUMNS} from training_enrollment where id = $1`, [
    enrollmentId,
  ]);
  return result.rows[0] ? toEnrollment(result.rows[0]) : null;
}

/** Cristian adjusts who the student is training as: objective, their goal in their words, level, zone. */
export async function updateEnrollmentProfile(
  client: PoolClient,
  enrollmentId: string,
  input: { objective: EnrollmentObjective | null; goal: string | null; level: EnrollmentLevel; zone: string | null },
): Promise<EnrollmentRow | null> {
  const result = await client.query<RawEnrollmentRow>(
    `update training_enrollment
     set objective = $2, goal = $3, level = $4, zone = $5, updated_at = now()
     where id = $1
     returning ${ENROLLMENT_COLUMNS}`,
    [enrollmentId, input.objective, input.goal || null, input.level, input.zone || null],
  );
  return result.rows[0] ? toEnrollment(result.rows[0]) : null;
}

/**
 * Cristian writes a student's routine for a week (/admin/alumnos/[id]).
 *
 * - `"week"`: only that week changes (its own training_week_routine row).
 * - `"forward"`: that week and every later one change; earlier weeks keep
 *   exactly what the student saw. Done by freezing each earlier week that
 *   was still following the base routine into its own row, then making the
 *   new routine the base and dropping overrides from `week` on — so past
 *   weeks (and the check-offs logged against them) never shift under the
 *   student's feet.
 */
export async function saveWeekRoutine(
  client: PoolClient,
  input: { enrollmentId: string; week: number; days: Routine; mode: "week" | "forward" },
): Promise<void> {
  const days = JSON.stringify(input.days);
  if (input.mode === "week") {
    await client.query(
      `insert into training_week_routine (enrollment_id, week, days) values ($1, $2, $3::jsonb)
       on conflict (enrollment_id, week) do update set days = excluded.days, updated_at = now()`,
      [input.enrollmentId, input.week, days],
    );
    return;
  }

  await client.query(
    `insert into training_week_routine (enrollment_id, week, days)
     select e.id, w, e.base_routine
     from training_enrollment e, generate_series(1, $2::int - 1) as w
     where e.id = $1
     on conflict (enrollment_id, week) do nothing`,
    [input.enrollmentId, input.week],
  );
  await client.query("update training_enrollment set base_routine = $2::jsonb, updated_at = now() where id = $1", [
    input.enrollmentId,
    days,
  ]);
  await client.query("delete from training_week_routine where enrollment_id = $1 and week >= $2", [
    input.enrollmentId,
    input.week,
  ]);
}

interface RawMeasurementRow {
  id: string;
  measured_on: string;
  push_ups: number | null;
  pull_ups: number | null;
  dips: number | null;
  plank_seconds: number | null;
  weight_kg: string | null;
}

const MEASUREMENT_COLUMNS = "id, measured_on::text as measured_on, push_ups, pull_ups, dips, plank_seconds, weight_kg";

function toMeasurement(row: RawMeasurementRow): Measurement {
  const n = (v: number | string | null) => (v === null ? null : Number(v));
  return {
    id: row.id,
    measuredOn: row.measured_on,
    pushUps: n(row.push_ups),
    pullUps: n(row.pull_ups),
    dips: n(row.dips),
    plankSeconds: n(row.plank_seconds),
    weightKg: n(row.weight_kg),
  };
}

/** Every max test for an enrollment, oldest first (the order the progress charts draw). */
export async function listMeasurements(db: Pool | PoolClient, enrollmentId: string): Promise<Measurement[]> {
  const result = await db.query<RawMeasurementRow>(
    `select ${MEASUREMENT_COLUMNS} from training_measurement where enrollment_id = $1 order by measured_on, created_at`,
    [enrollmentId],
  );
  return result.rows.map(toMeasurement);
}

export async function addMeasurement(
  db: Pool | PoolClient,
  enrollmentId: string,
  input: MeasurementInput,
): Promise<Measurement> {
  const result = await db.query<RawMeasurementRow>(
    `insert into training_measurement (enrollment_id, measured_on, push_ups, pull_ups, dips, plank_seconds, weight_kg)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning ${MEASUREMENT_COLUMNS}`,
    [
      enrollmentId,
      input.measuredOn,
      input.pushUps ?? null,
      input.pullUps ?? null,
      input.dips ?? null,
      input.plankSeconds ?? null,
      input.weightKg ?? null,
    ],
  );
  return toMeasurement(result.rows[0]);
}

/** Removes one entry — only if it belongs to that enrollment (a student can only delete their own). */
export async function deleteMeasurement(db: Pool | PoolClient, enrollmentId: string, measurementId: string): Promise<boolean> {
  const result = await db.query("delete from training_measurement where id = $1 and enrollment_id = $2", [
    measurementId,
    enrollmentId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * The free tier (docs/TRAINING.md, "Free tier"): signing up at
 * /entrenar/gratis gives an ACTIVE enrollment in the free program right
 * away — no approval, no payment — starting today, on the beginner
 * template, with the same app as paying students. Idempotent: signing up
 * again keeps the existing enrollment (and its progress).
 */
export async function ensureFreeEnrollment(
  client: PoolClient,
  input: { contactId: string; objective: EnrollmentObjective | null; startDate: string },
): Promise<EnrollmentRow | null> {
  const productId = await getProductIdBySlug(client, FREE_PROGRAM_PRODUCT_SLUG);
  if (!productId) return null;
  const enrollment = await upsertPendingEnrollment(client, {
    contactId: input.contactId,
    productId,
    objective: input.objective,
  });
  if (enrollment.status !== "pending") return enrollment;
  return activateEnrollment(client, enrollment.id, input.startDate);
}

/** Which program an enrollment belongs to — for the app header and the free-tier upsell. */
export async function getProgramOf(
  db: Pool | PoolClient,
  enrollmentId: string,
): Promise<{ slug: string; name: string } | null> {
  const result = await db.query<{ slug: string; name: string }>(
    "select p.slug, p.name from training_enrollment e join product p on p.id = e.product_id where e.id = $1",
    [enrollmentId],
  );
  return result.rows[0] ?? null;
}
