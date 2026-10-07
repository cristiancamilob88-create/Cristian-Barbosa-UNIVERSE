import "server-only";
import { cache } from "react";
import { getPool } from "@/server/db/pool";
import { getContactById } from "@/server/db/repositories/contact";
import {
  FREE_PROGRAM_PRODUCT_SLUG,
  getMemberEnrollment,
  getProgramOf,
  getTrainingLogs,
  getWeekRoutines,
  type EnrollmentRow,
} from "@/server/db/repositories/training";
import type { Routine, WeekLogs } from "@/lib/training";

export interface MemberPlan {
  name: string | null;
  /** The program's display name, e.g. "Plan Diciembre — 12 semanas…". */
  programName: string;
  /** True on the free tier — the app shows the upsell to the paid options. */
  isFree: boolean;
  enrollment: EnrollmentRow;
  weekRoutines: Record<number, Routine>;
  logs: WeekLogs;
}

/**
 * Everything the /mi-plan pages render for the signed-in student, read
 * once per request — React's cache() dedupes the layout's call and the
 * page's call into one set of queries. Null when the contact has no
 * started, entitled enrollment (never approved, or access removed): the
 * layout shows "no active plan" instead of the pages.
 */
export const getMemberPlan = cache(async (contactId: string): Promise<MemberPlan | null> => {
  const db = getPool();
  const enrollment = await getMemberEnrollment(db, contactId);
  if (!enrollment) return null;
  const [contact, weekRoutines, logs, program] = await Promise.all([
    getContactById(db, contactId),
    getWeekRoutines(db, enrollment.id),
    getTrainingLogs(db, enrollment.id),
    getProgramOf(db, enrollment.id),
  ]);
  return {
    name: contact?.name ?? null,
    programName: program?.name ?? "Tu plan",
    isFree: program?.slug === FREE_PROGRAM_PRODUCT_SLUG,
    enrollment,
    weekRoutines,
    logs,
  };
});
