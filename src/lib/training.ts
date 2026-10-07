import { z } from "zod";

/**
 * Pure, client-safe rules for a training program (Plan Diciembre and
 * any later one) — which week a student is in, which routine applies to
 * a week, how much of it they've done. No DB, no env: the same functions
 * run in the /mi-plan Server Components, in the checkbox client
 * component (optimistic %), and in the admin roster, so the three can
 * never disagree about "week 4, 60%".
 */

export const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dose: z.string().trim().max(60).default(""),
  cue: z.string().trim().max(200).default(""),
});

export const routineDaySchema = z.object({
  title: z.string().trim().min(1).max(120),
  kind: z.string().trim().max(60).default(""),
  exercises: z.array(exerciseSchema).min(1).max(20),
});

export const routineSchema = z.array(routineDaySchema).max(14);

export type Exercise = z.infer<typeof exerciseSchema>;
export type RoutineDay = z.infer<typeof routineDaySchema>;
export type Routine = z.infer<typeof routineSchema>;

/**
 * One day's check-offs, results and note, as stored in training_log.
 * `results[i]` is what the student actually did on exercise i, in their
 * own words ("10, 8, 7", "35 s") — same positions as `done`.
 */
export interface DayLog {
  done: boolean[];
  results: string[];
  note: string | null;
}

/** week -> dayIndex -> log. Only days the student touched have an entry. */
export type WeekLogs = Record<number, Record<number, DayLog>>;

export type EnrollmentStatus = "pending" | "active" | "paused" | "finished" | "cancelled";
export type EnrollmentLevel = "principiante" | "intermedio" | "avanzado";
export type EnrollmentObjective = "bajar_peso" | "fuerza" | "tonificar" | "skills" | "general";

/** A student's main objective — how Cristian programs them (migration 0018). */
export const OBJECTIVE_LABEL: Record<EnrollmentObjective, string> = {
  bajar_peso: "Bajar de peso",
  fuerza: "Ganar fuerza",
  tonificar: "Tonificar",
  skills: "Aprender skills",
  general: "Estar en forma",
};

export const LEVEL_LABEL: Record<EnrollmentLevel, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  pending: "Por aprobar",
  active: "Activo",
  paused: "En pausa",
  finished: "Terminado",
  cancelled: "Cancelado",
};

/** Zones Plan Diciembre covers (Cristian's sales script) — "Otra" for anyone outside them. */
export const TRAINING_ZONES = ["Envigado", "Las Palmas", "Sabaneta", "Llanogrande", "Otra"] as const;

const DAY_MS = 86_400_000;

/**
 * Today's date in Colombia as YYYY-MM-DD — Cristian's and his students'
 * timezone, not the server's (Vercel runs in UTC, which would flip the
 * week at 7pm Bogotá time on a Sunday).
 */
export function todayInBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(now);
}

/** Parses a YYYY-MM-DD date as a UTC midnight — only ever used for whole-day arithmetic. */
function parseDay(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Which week of the program `today` falls in, clamped to 1..weeks —
 * before the start date it's week 1, after the end it's the last week.
 * Week 1 is start_date through start_date + 6 days.
 */
export function currentWeek(startDate: string, weeks: number, today: string = todayInBogota()): number {
  const elapsedDays = Math.floor((parseDay(today) - parseDay(startDate)) / DAY_MS);
  const week = Math.floor(elapsedDays / 7) + 1;
  return Math.min(Math.max(week, 1), weeks);
}

/** First and last day (YYYY-MM-DD) of a given week of the program. */
export function weekRange(startDate: string, week: number): { from: string; to: string } {
  const from = parseDay(startDate) + (week - 1) * 7 * DAY_MS;
  return { from: formatDay(from), to: formatDay(from + 6 * DAY_MS) };
}

const SHORT_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** "7 oct" — the short day label the week views use. */
export function formatShortDay(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  return `${d} ${SHORT_MONTHS[m - 1]}`;
}

/** Month index (0-11) of a YYYY-MM-DD date. */
export function monthOf(isoDate: string): number {
  return Number(isoDate.split("-")[1]) - 1;
}

/**
 * The routine a week uses: its own override if Cristian wrote one,
 * otherwise the student's base routine.
 */
export function routineForWeek(baseRoutine: Routine, weekOverrides: Record<number, Routine>, week: number): Routine {
  return weekOverrides[week] ?? baseRoutine;
}

/** Done/total exercises for one week — counts only exercises that exist in that week's routine. */
export function weekCompletion(routine: Routine, dayLogs: Record<number, DayLog> | undefined): {
  done: number;
  total: number;
  percent: number;
} {
  let done = 0;
  let total = 0;
  routine.forEach((day, dayIndex) => {
    const checks = dayLogs?.[dayIndex]?.done ?? [];
    day.exercises.forEach((_, exerciseIndex) => {
      total += 1;
      if (checks[exerciseIndex]) done += 1;
    });
  });
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export type WeekStanding = "idle" | "good" | "warn" | "bad";

/**
 * Cristian's own thresholds (Plan Diciembre brief): Al día ≥80%,
 * A medias 40–79%, Se está quedando <40%. A week with nothing logged
 * at all is "Sin registros", not "Se está quedando" — no data isn't the
 * same claim as falling behind.
 */
export function weekStanding(percent: number, hasAnyLog: boolean): { standing: WeekStanding; label: string } {
  if (!hasAnyLog) return { standing: "idle", label: "Sin registros" };
  if (percent >= 80) return { standing: "good", label: "Al día" };
  if (percent >= 40) return { standing: "warn", label: "A medias" };
  return { standing: "bad", label: "Se está quedando" };
}

/**
 * Parses a routine read from the database. A malformed row (hand-edited
 * JSON, an older shape) degrades to an empty routine instead of
 * crashing the student's page.
 */
export function parseRoutine(value: unknown): Routine {
  const parsed = routineSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}
