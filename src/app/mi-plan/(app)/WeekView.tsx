"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { weekCompletion, type DayLog, type Routine } from "@/lib/training";

interface Props {
  week: number;
  routine: Routine;
  initialLogs: Record<number, DayLog>;
  /** Paused/finished plans can be looked at, not edited. */
  readOnly: boolean;
}

type SaveBody = { week: number; dayIndex: number; done?: boolean[]; results?: string[]; note?: string };

async function saveLog(body: SaveBody): Promise<string | null> {
  try {
    const res = await fetch("/api/member/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    return payload?.error ?? "No se guardó.";
  } catch {
    return "Sin conexión: no se guardó.";
  }
}

const EMPTY_DAY: DayLog = { done: [], results: [], note: null };

/**
 * The interactive part of "Mi semana". Per exercise the student ticks
 * whether they did it and writes what they actually did ("10, 8, 7",
 * "35 s") — the data Cristian reads to adjust the plan. Checkboxes update
 * instantly (optimistic) and a failed save puts the box back and says so,
 * so the screen never shows something that isn't stored. Results and
 * notes save when the student leaves the field.
 */
export function WeekView({ week, routine, initialLogs, readOnly }: Props) {
  const [logs, setLogs] = useState<Record<number, DayLog>>(initialLogs);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  // What the server has, per day — so leaving a field unchanged doesn't re-save it.
  const saved = useRef<Record<number, DayLog>>(structuredClone(initialLogs));
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(text: string, error = false) {
    setMessage({ text, error });
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2500);
  }

  function patchDay(dayIndex: number, patch: Partial<DayLog>) {
    setLogs((current) => ({ ...current, [dayIndex]: { ...EMPTY_DAY, ...current[dayIndex], ...patch } }));
  }

  const { percent } = weekCompletion(routine, logs);

  async function toggle(dayIndex: number, exerciseIndex: number, checked: boolean) {
    const count = routine[dayIndex].exercises.length;
    const previous = logs[dayIndex]?.done ?? [];
    const done = Array.from({ length: count }, (_, i) => Boolean(previous[i]));
    done[exerciseIndex] = checked;
    patchDay(dayIndex, { done });

    const error = await saveLog({ week, dayIndex, done });
    if (error) {
      patchDay(dayIndex, { done: previous });
      flash(error, true);
    }
  }

  async function saveResult(dayIndex: number, exerciseIndex: number, value: string) {
    const count = routine[dayIndex].exercises.length;
    const current = saved.current[dayIndex]?.results ?? [];
    const results = Array.from({ length: count }, (_, i) => (current[i] ?? "").trim());
    if (results[exerciseIndex] === value.trim()) return;
    results[exerciseIndex] = value.trim();

    const error = await saveLog({ week, dayIndex, results });
    if (error) {
      flash(error, true);
      return;
    }
    saved.current[dayIndex] = { ...EMPTY_DAY, ...saved.current[dayIndex], results };
    patchDay(dayIndex, { results });
    flash("Guardado");
  }

  async function saveNote(dayIndex: number, value: string) {
    const note = value.trim();
    if ((saved.current[dayIndex]?.note ?? "") === note) return;
    const error = await saveLog({ week, dayIndex, note });
    if (error) {
      flash(error, true);
      return;
    }
    saved.current[dayIndex] = { ...EMPTY_DAY, ...saved.current[dayIndex], note };
    patchDay(dayIndex, { note });
    flash("Nota guardada");
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div
          className="h-2 overflow-hidden bg-steel-dim/30"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Cumplimiento de la semana"
        >
          <div className="h-full bg-ember transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-steel">{percent}% de la semana cumplida</p>
      </div>

      {routine.map((day, dayIndex) => {
        const log = logs[dayIndex];
        const doneCount = day.exercises.filter((_, i) => log?.done[i]).length;
        return (
          <section key={dayIndex} className="border border-steel-dim/40 bg-ink-raised">
            <div className="flex items-baseline justify-between gap-3 border-b border-steel-dim/40 px-4 py-3">
              <div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">{day.title}</h2>
                {day.kind && <p className="font-mono text-[11px] uppercase tracking-widest text-steel">{day.kind}</p>}
              </div>
              <span className="font-mono text-sm text-chalk">
                {doneCount}/{day.exercises.length}
              </span>
            </div>
            <ul>
              {day.exercises.map((exercise, exerciseIndex) => {
                const checked = Boolean(log?.done[exerciseIndex]);
                const id = `ex-${week}-${dayIndex}-${exerciseIndex}`;
                return (
                  <li key={exerciseIndex} className="border-b border-steel-dim/30 px-4 py-3 last:border-b-0">
                    <label htmlFor={id} className="flex cursor-pointer items-center gap-4">
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly}
                        onChange={(e) => toggle(dayIndex, exerciseIndex, e.target.checked)}
                        className="h-6 w-6 shrink-0 accent-ember"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block font-semibold ${checked ? "text-steel line-through" : "text-chalk"}`}>
                          {exercise.name}
                        </span>
                        {exercise.cue && <span className="block text-sm text-steel">{exercise.cue}</span>}
                      </span>
                      {exercise.dose && (
                        <span className="whitespace-nowrap font-display text-lg font-black text-chalk">{exercise.dose}</span>
                      )}
                    </label>
                    <div className="mt-2 flex items-center gap-2 pl-10">
                      <label htmlFor={`${id}-r`} className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-steel-dim">
                        Hice
                      </label>
                      <input
                        id={`${id}-r`}
                        type="text"
                        defaultValue={log?.results?.[exerciseIndex] ?? ""}
                        disabled={readOnly}
                        maxLength={60}
                        placeholder="Ej: 10, 8, 8 · 35 s"
                        onBlur={(e) => saveResult(dayIndex, exerciseIndex, e.target.value)}
                        className="min-w-0 flex-1 border border-steel-dim/40 bg-ink px-2 py-1.5 text-sm text-chalk outline-none placeholder:text-steel-dim focus:border-ember"
                      />
                      {exercise.exerciseId && (
                        <Link
                          href={`/mi-plan/biblioteca/${exercise.exerciseId}`}
                          className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-tide underline-offset-4 hover:underline"
                        >
                          Cómo se hace
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-2 border-t border-steel-dim/40 px-4 py-3">
              <label htmlFor={`note-${week}-${dayIndex}`} className="font-mono text-[11px] uppercase tracking-widest text-steel">
                ¿Cómo te fue?
              </label>
              <textarea
                id={`note-${week}-${dayIndex}`}
                defaultValue={log?.note ?? ""}
                disabled={readOnly}
                maxLength={1000}
                rows={2}
                placeholder="Ej: me dolió el hombro, la plancha me quedó fácil…"
                onBlur={(e) => saveNote(dayIndex, e.target.value)}
                className="resize-y border border-steel-dim/50 bg-ink px-3 py-2 text-sm text-chalk outline-none placeholder:text-steel-dim focus:border-ember"
              />
            </div>
          </section>
        );
      })}

      {message && (
        <p
          role="status"
          className={`fixed bottom-6 left-1/2 z-20 -translate-x-1/2 px-4 py-2 font-mono text-xs uppercase tracking-wider ${
            message.error ? "bg-ember text-ink" : "bg-chalk text-ink"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
