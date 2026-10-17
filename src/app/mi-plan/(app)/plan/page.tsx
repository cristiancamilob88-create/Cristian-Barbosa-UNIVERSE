import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberContactId } from "@/server/auth/memberAuth";
import { getMemberPlan } from "@/server/training/member";
import {
  MONTHS,
  currentWeek,
  formatShortDay,
  monthOf,
  routineForWeek,
  weekCompletion,
  weekRange,
  weekStanding,
  type WeekStanding,
} from "@/lib/training";

export const metadata: Metadata = { title: "Mi plan" };

const STANDING_CLASS: Record<WeekStanding, string> = {
  good: "bg-tide/15 text-tide",
  warn: "bg-chalk/10 text-chalk",
  bad: "bg-ember/15 text-ember",
  idle: "bg-steel-dim/20 text-steel",
};

/** "Mi plan" — every week of the program, grouped by the month it starts in, with how much of each got done. */
export default async function MemberPlanPage() {
  const contactId = await requireMemberContactId();
  const plan = await getMemberPlan(contactId);
  if (!plan) return null;

  const { enrollment } = plan;
  const startDate = enrollment.startDate as string;
  const thisWeek = currentWeek(startDate, enrollment.weeks);

  const months: { month: number; weeks: number[] }[] = [];
  for (let week = 1; week <= enrollment.weeks; week++) {
    const month = monthOf(weekRange(startDate, week).from);
    const last = months[months.length - 1];
    if (last && last.month === month) last.weeks.push(week);
    else months.push({ month, weeks: [week] });
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-steel">
        Arrancaste el {formatShortDay(startDate)}. Toca una semana para ver su rutina.
      </p>
      {months.map(({ month, weeks }) => (
        <section key={`${month}-${weeks[0]}`} className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">{MONTHS[month]}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {weeks.map((week) => {
              const range = weekRange(startDate, week);
              const logs = plan.logs[week];
              const hasLogs = logs !== undefined && Object.keys(logs).length > 0;
              const future = week > thisWeek;
              const { percent } = weekCompletion(routineForWeek(enrollment.baseRoutine, plan.weekRoutines, week), logs);
              // The week in progress says "En curso", not a verdict — telling a
              // student they're "falling behind" on a Wednesday isn't fair.
              // Cristian's roster (/admin/alumnos) still shows the real standing.
              const { standing, label } =
                future && !hasLogs
                  ? { standing: "idle" as const, label: "Próxima" }
                  : week === thisWeek
                    ? { standing: "idle" as const, label: "En curso" }
                    : weekStanding(percent, hasLogs);
              return (
                <Link
                  key={week}
                  href={`/mi-plan?semana=${week}`}
                  className={`flex flex-col gap-2 border bg-ink-raised p-3 transition-colors hover:border-ember ${
                    week === thisWeek ? "border-ember" : "border-steel-dim/40"
                  }`}
                >
                  <span className="font-display text-lg font-black uppercase tracking-tight text-chalk">Semana {week}</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-steel">
                    {formatShortDay(range.from)} – {formatShortDay(range.to)}
                  </span>
                  <span className={`font-display text-3xl font-black ${future && !hasLogs ? "text-steel-dim" : "text-chalk"}`}>
                    {future && !hasLogs ? "—" : `${percent}%`}
                  </span>
                  <span className={`w-fit px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${STANDING_CLASS[standing]}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
