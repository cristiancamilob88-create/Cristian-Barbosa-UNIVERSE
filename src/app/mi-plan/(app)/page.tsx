import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberContactId } from "@/server/auth/memberAuth";
import { getMemberPlan } from "@/server/training/member";
import { currentWeek, formatShortDay, routineForWeek, weekRange } from "@/lib/training";
import { WeekView } from "./WeekView";

export const metadata: Metadata = { title: "Mi semana" };

const arrowClass =
  "flex h-11 w-11 items-center justify-center border border-steel-dim/50 text-lg text-chalk transition-colors hover:border-ember hover:text-ember";

/**
 * "Mi semana" — the screen a student opens several times a week: this
 * week's days, each exercise with its dose and cue, a checkbox per
 * exercise and a note per day. ?semana=N shows another week (from the
 * arrows or from "Mi plan").
 */
export default async function MemberWeekPage(props: PageProps<"/mi-plan">) {
  const contactId = await requireMemberContactId();
  const plan = await getMemberPlan(contactId);
  // The layout already renders the "no active plan" state for this case.
  if (!plan) return null;

  const { enrollment } = plan;
  const startDate = enrollment.startDate as string;
  const thisWeek = currentWeek(startDate, enrollment.weeks);

  const params = await props.searchParams;
  const raw = Number(Array.isArray(params.semana) ? params.semana[0] : params.semana);
  const week = Number.isInteger(raw) && raw >= 1 && raw <= enrollment.weeks ? raw : thisWeek;

  const routine = routineForWeek(enrollment.baseRoutine, plan.weekRoutines, week);
  const range = weekRange(startDate, week);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        {week > 1 ? (
          <Link href={`/mi-plan?semana=${week - 1}`} aria-label="Semana anterior" className={arrowClass}>
            ‹
          </Link>
        ) : (
          <span className="h-11 w-11" />
        )}
        <div className="text-center">
          <p className="font-display text-2xl font-black uppercase tracking-tight text-chalk">
            Semana {week} de {enrollment.weeks}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-steel">
            {formatShortDay(range.from)} – {formatShortDay(range.to)}
            {week === thisWeek && <span className="text-ember"> · Esta semana</span>}
          </p>
        </div>
        {week < enrollment.weeks ? (
          <Link href={`/mi-plan?semana=${week + 1}`} aria-label="Semana siguiente" className={arrowClass}>
            ›
          </Link>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>

      {routine.length === 0 ? (
        <p className="border border-dashed border-steel-dim/50 p-6 text-center text-steel">
          Cristian todavía está armando la rutina de esta semana.
        </p>
      ) : (
        <WeekView
          key={week}
          week={week}
          routine={routine}
          initialLogs={plan.logs[week] ?? {}}
          readOnly={enrollment.status !== "active"}
        />
      )}
    </div>
  );
}
