"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { fetchExerciseLibrary } from "@/lib/adminExercises";
import { searchKey, type Exercise as LibraryExercise } from "@/lib/exercises";
import { LoadingBlock, ErrorBlock } from "@/components/admin/states";
import { ProgressView } from "@/components/training/ProgressView";
import {
  AdminTrainingApiError,
  addStudentMeasurement,
  fetchStudentMeasurements,
  fetchStudentWeek,
  saveStudentRoutine,
  updateStudentProfile,
  type StudentWeekDetail,
} from "@/lib/adminTraining";
import {
  LEVEL_LABEL,
  OBJECTIVE_LABEL,
  STATUS_LABEL,
  TRAINING_ZONES,
  formatShortDay,
  weekCompletion,
  weekRange,
  formatDuration,
  type EnrollmentLevel,
  type EnrollmentObjective,
  type Measurement,
  type Routine,
} from "@/lib/training";

const fieldClass =
  "rounded border border-steel-dim/60 bg-ink px-3 py-2 text-sm text-chalk outline-none placeholder:text-steel-dim focus:border-ember";
const primaryButton =
  "rounded bg-ember px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-rust disabled:opacity-60";
const ghostButton =
  "rounded border border-steel-dim/60 px-3 py-2 font-mono text-xs uppercase tracking-wider text-steel transition-colors hover:border-chalk hover:text-chalk disabled:opacity-60";
const labelClass = "font-mono text-[11px] uppercase tracking-widest text-steel";

function errorText(err: unknown, fallback: string): string {
  return err instanceof AdminTrainingApiError ? err.message : fallback;
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: StudentWeekDetail };

export function StudentPageContent({ enrollmentId }: { enrollmentId: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [week, setWeek] = useState<number | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped on every successful load, so the forms below start fresh from
  // what the server now has (after a save, or when switching weeks).
  const [version, setVersion] = useState(0);

  const load = useCallback(
    (targetWeek?: number) => {
      fetchStudentWeek(enrollmentId, targetWeek)
        .then((data) => {
          setState({ status: "ready", data });
          setWeek(data.week);
          setVersion((v) => v + 1);
        })
        .catch((err) => setState({ status: "error", message: errorText(err, "No se pudo cargar el alumno.") }));
    },
    [enrollmentId],
  );

  useEffect(() => load(), [load]);

  function flash(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(null), 3000);
  }

  if (state.status === "loading") return <LoadingBlock />;
  if (state.status === "error") return <ErrorBlock message={state.message} />;

  const { data } = state;
  const { enrollment, contact } = data;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">
          {STATUS_LABEL[enrollment.status]}
          {data.currentWeek !== null && ` · Va en la semana ${data.currentWeek} de ${enrollment.weeks}`}
        </p>
        <h2 className="font-display text-3xl font-black uppercase tracking-tight text-chalk">{contact.name ?? "Sin nombre"}</h2>
        <p className="break-all text-sm text-steel">{[contact.email, contact.phone].filter(Boolean).join(" · ")}</p>
      </header>

      {notice && (
        <p role="status" className="border border-tide/40 bg-tide/10 px-4 py-3 text-sm text-tide">
          {notice}
        </p>
      )}

      <ProfileForm
        key={`profile-${version}`}
        detail={data}
        onSaved={() => {
          flash("Perfil guardado.");
          load(week);
        }}
      />

      <StudentProgress enrollmentId={enrollment.id} />

      <WeekNav detail={data} onChange={(w) => load(w)} />

      <WeekLog detail={data} />

      <RoutineEditor
        key={`routine-${version}`}
        detail={data}
        onSaved={(mode) => {
          flash(
            mode === "week"
              ? `Rutina guardada solo para la semana ${data.week}.`
              : `Rutina guardada desde la semana ${data.week} en adelante. Las semanas anteriores no cambiaron.`,
          );
          load(data.week);
        }}
      />
    </div>
  );
}

function ProfileForm({ detail, onSaved }: { detail: StudentWeekDetail; onSaved: () => void }) {
  const { enrollment } = detail;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await updateStudentProfile(enrollment.id, {
        objective: String(data.get("objective") ?? "") as EnrollmentObjective | "",
        goal: String(data.get("goal") ?? ""),
        level: String(data.get("level") ?? "principiante") as EnrollmentLevel,
        zone: String(data.get("zone") ?? ""),
      });
      onSaved();
    } catch (err) {
      setError(errorText(err, "No se pudo guardar el perfil."));
    } finally {
      setPending(false);
    }
  }

  const zones: string[] = [...TRAINING_ZONES];
  if (enrollment.zone && !zones.includes(enrollment.zone)) zones.unshift(enrollment.zone);

  return (
    <form onSubmit={submit} className="grid gap-3 border border-steel-dim/40 bg-ink-raised p-4 sm:grid-cols-2">
      <p className="font-display text-xl font-black uppercase tracking-tight text-chalk sm:col-span-2">Perfil</p>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Objetivo principal</span>
        <select name="objective" defaultValue={enrollment.objective ?? ""} className={fieldClass}>
          <option value="">Sin definir</option>
          {Object.entries(OBJECTIVE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Nivel</span>
        <select name="level" defaultValue={enrollment.level} className={fieldClass}>
          {Object.entries(LEVEL_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className={labelClass}>Meta en sus palabras</span>
        <input name="goal" defaultValue={enrollment.goal ?? ""} maxLength={300} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>Zona</span>
        <select name="zone" defaultValue={enrollment.zone ?? ""} className={fieldClass}>
          <option value="">Sin definir</option>
          {zones.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </select>
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Guardando…" : "Guardar perfil"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-ember sm:col-span-2">
          {error}
        </p>
      )}
    </form>
  );
}

function StudentProgress({ enrollmentId }: { enrollmentId: string }) {
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentMeasurements(enrollmentId)
      .then(setMeasurements)
      .catch((err) => setError(errorText(err, "No se pudieron cargar sus pruebas.")));
  }, [enrollmentId]);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xl font-black uppercase tracking-tight text-chalk">Pruebas de máximo</h3>
      {error && <p className="text-sm text-ember">{error}</p>}
      {measurements === null && !error && <LoadingBlock />}
      {measurements !== null && (
        <ProgressView
          measurements={measurements}
          canEdit
          onAdd={async (input) => {
            try {
              return await addStudentMeasurement(enrollmentId, input);
            } catch (err) {
              return errorText(err, "No se pudo guardar la prueba.");
            }
          }}
        />
      )}
    </section>
  );
}

function WeekNav({ detail, onChange }: { detail: StudentWeekDetail; onChange: (week: number) => void }) {
  const { week, enrollment } = detail;
  const range = enrollment.startDate ? weekRange(enrollment.startDate, week) : null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={ghostButton} disabled={week <= 1} onClick={() => onChange(week - 1)} aria-label="Semana anterior">
        ‹
      </button>
      <select
        value={week}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${fieldClass} font-display text-lg font-black uppercase`}
        aria-label="Semana"
      >
        {Array.from({ length: enrollment.weeks }, (_, i) => i + 1).map((w) => (
          <option key={w} value={w}>
            Semana {w}
            {w === detail.currentWeek ? " (actual)" : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={ghostButton}
        disabled={week >= enrollment.weeks}
        onClick={() => onChange(week + 1)}
        aria-label="Semana siguiente"
      >
        ›
      </button>
      {range && (
        <span className="font-mono text-xs uppercase tracking-widest text-steel">
          {formatShortDay(range.from)} – {formatShortDay(range.to)}
        </span>
      )}
    </div>
  );
}

function WeekLog({ detail }: { detail: StudentWeekDetail }) {
  const { routine, logs, week } = detail;
  const { percent, done, total } = weekCompletion(routine, logs);
  const hasAny = Object.keys(logs).length > 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-black uppercase tracking-tight text-chalk">Lo que registró · semana {week}</h3>
        <span className="font-mono text-sm text-chalk">
          {done}/{total} · {percent}%
        </span>
      </div>
      {!hasAny ? (
        <p className="border border-dashed border-steel-dim/50 p-4 text-sm text-steel">Todavía no registró nada esta semana.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {routine.map((day, dayIndex) => {
            const log = logs[dayIndex];
            return (
              <div key={dayIndex} className="border border-steel-dim/40 bg-ink-raised p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-lg font-black uppercase tracking-tight text-chalk">{day.title}</p>
                  {log?.durationSeconds != null && (
                    <span className="font-mono text-xs text-tide">⏱ {formatDuration(log.durationSeconds)}</span>
                  )}
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {day.exercises.map((exercise, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-sm">
                      <span className={log?.done[i] ? "text-tide" : "text-steel-dim"} aria-label={log?.done[i] ? "Cumplido" : "No marcado"}>
                        {log?.done[i] ? "✓" : "·"}
                      </span>
                      <span className="text-chalk">{exercise.name}</span>
                      <span className="text-steel-dim">{exercise.dose}</span>
                      {log?.results?.[i] && <span className="ml-auto font-mono text-chalk">{log.results[i]}</span>}
                    </li>
                  ))}
                </ul>
                {log?.note && <p className="mt-3 border-l-2 border-steel-dim/60 pl-3 text-sm text-steel">“{log.note}”</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function blankExercise() {
  return { name: "", dose: "", cue: "" };
}

function RoutineEditor({ detail, onSaved }: { detail: StudentWeekDetail; onSaved: (mode: "week" | "forward") => void }) {
  const { enrollment, week } = detail;
  const [days, setDays] = useState<Routine>(() => structuredClone(detail.routine));
  const [pending, setPending] = useState<"week" | "forward" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLogs = Object.keys(detail.logs).length > 0;

  // The exercise library, for name suggestions and linking: an exercise
  // whose name matches a library entry gets its exerciseId, so the
  // student sees "Cómo se hace" next to it. The editor works without it.
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  useEffect(() => {
    fetchExerciseLibrary()
      .then((data) => setLibrary(data.exercises.filter((e) => e.active)))
      .catch(() => setLibrary([]));
  }, []);
  const byName = useMemo(() => new Map(library.map((e) => [searchKey(e.name), e])), [library]);
  const libraryMatch = (name: string) => byName.get(searchKey(name));

  function updateDay(dayIndex: number, patch: Partial<Routine[number]>) {
    setDays((current) => current.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d)));
  }
  function updateExercise(dayIndex: number, exerciseIndex: number, patch: Partial<Routine[number]["exercises"][number]>) {
    setDays((current) =>
      current.map((d, i) =>
        i === dayIndex ? { ...d, exercises: d.exercises.map((e, j) => (j === exerciseIndex ? { ...e, ...patch } : e)) } : d,
      ),
    );
  }
  function moveExercise(dayIndex: number, exerciseIndex: number, delta: -1 | 1) {
    setDays((current) =>
      current.map((d, i) => {
        if (i !== dayIndex) return d;
        const target = exerciseIndex + delta;
        if (target < 0 || target >= d.exercises.length) return d;
        const exercises = [...d.exercises];
        [exercises[exerciseIndex], exercises[target]] = [exercises[target], exercises[exerciseIndex]];
        return { ...d, exercises };
      }),
    );
  }

  async function save(mode: "week" | "forward") {
    const clean = days
      .map((d) => ({ ...d, title: d.title.trim(), exercises: d.exercises.filter((e) => e.name.trim()) }))
      .filter((d) => d.exercises.length > 0);
    if (clean.length === 0 || clean.some((d) => !d.title)) {
      setError("Cada día necesita un nombre y al menos un ejercicio con nombre.");
      return;
    }
    setPending(mode);
    setError(null);
    try {
      await saveStudentRoutine(enrollment.id, { week, days: clean, mode });
      onSaved(mode);
    } catch (err) {
      setError(errorText(err, "No se pudo guardar la rutina."));
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-xl font-black uppercase tracking-tight text-chalk">Su rutina · semana {week}</h3>
        <p className="mt-1 text-sm text-steel">
          {detail.hasOwnRoutine
            ? "Esta semana tiene su propia rutina."
            : "Esta semana usa su rutina base (la misma que las demás semanas sin rutina propia)."}
        </p>
        {hasLogs && (
          <p className="mt-1 text-sm text-ember">
            Ojo: ya registró cosas esta semana. Si cambias el orden o quitas ejercicios, lo que marcó puede quedar en otro
            ejercicio.
          </p>
        )}
      </div>

      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="flex flex-col gap-3 border border-steel-dim/40 bg-ink-raised p-4">
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Día {dayIndex + 1}</span>
              <input
                value={day.title}
                onChange={(e) => updateDay(dayIndex, { title: e.target.value })}
                placeholder="Ej: Clase 1 · Pecho y tríceps"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Tipo</span>
              <input
                value={day.kind}
                onChange={(e) => updateDay(dayIndex, { kind: e.target.value })}
                placeholder="Clase / Por tu cuenta"
                className={fieldClass}
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                className={ghostButton}
                onClick={() => setDays((current) => current.filter((_, i) => i !== dayIndex))}
              >
                Quitar día
              </button>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {day.exercises.map((exercise, exerciseIndex) => (
              <li key={exerciseIndex} className="grid gap-2 border-t border-steel-dim/30 pt-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
                <div className="flex flex-col gap-1">
                  <input
                    value={exercise.name}
                    list="exercise-library"
                    onChange={(e) => {
                      const match = libraryMatch(e.target.value);
                      updateExercise(dayIndex, exerciseIndex, {
                        name: match ? match.name : e.target.value,
                        exerciseId: match?.id,
                      });
                    }}
                    placeholder="Ejercicio"
                    aria-label="Ejercicio"
                    className={fieldClass}
                  />
                  {exercise.exerciseId && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-tide">En biblioteca · el alumno ve el video</span>
                  )}
                </div>
                <input
                  value={exercise.dose}
                  onChange={(e) => updateExercise(dayIndex, exerciseIndex, { dose: e.target.value })}
                  placeholder="3 × 10"
                  aria-label="Series × repeticiones"
                  className={fieldClass}
                />
                <input
                  value={exercise.cue}
                  onChange={(e) => updateExercise(dayIndex, exerciseIndex, { cue: e.target.value })}
                  placeholder="Indicación técnica"
                  aria-label="Indicación técnica"
                  className={fieldClass}
                />
                <div className="flex gap-1">
                  <button type="button" className={ghostButton} onClick={() => moveExercise(dayIndex, exerciseIndex, -1)} aria-label="Subir">
                    ↑
                  </button>
                  <button type="button" className={ghostButton} onClick={() => moveExercise(dayIndex, exerciseIndex, 1)} aria-label="Bajar">
                    ↓
                  </button>
                  <button
                    type="button"
                    className={ghostButton}
                    aria-label="Quitar ejercicio"
                    onClick={() =>
                      updateDay(dayIndex, { exercises: day.exercises.filter((_, j) => j !== exerciseIndex) })
                    }
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`${ghostButton} w-fit`}
            onClick={() => updateDay(dayIndex, { exercises: [...day.exercises, blankExercise()] })}
          >
            + Ejercicio
          </button>
        </div>
      ))}

      <datalist id="exercise-library">
        {library.map((e) => (
          <option key={e.id} value={e.name} />
        ))}
      </datalist>

      <button
        type="button"
        className={`${ghostButton} w-fit border-dashed text-ember`}
        onClick={() => setDays((current) => [...current, { title: "", kind: "Por tu cuenta", exercises: [blankExercise()] }])}
      >
        + Día
      </button>

      {error && (
        <p role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending !== null} onClick={() => save("week")} className={primaryButton}>
          {pending === "week" ? "Guardando…" : `Guardar solo semana ${week}`}
        </button>
        <button type="button" disabled={pending !== null} onClick={() => save("forward")} className={ghostButton}>
          {pending === "forward" ? "Guardando…" : `Guardar de la semana ${week} en adelante`}
        </button>
      </div>
    </section>
  );
}
