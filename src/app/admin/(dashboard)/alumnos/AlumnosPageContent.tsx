"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "@/components/admin/states";
import {
  AdminTrainingApiError,
  activateStudent,
  createStudent,
  fetchTrainingRoster,
  invitationMessage,
  whatsappLink,
  type TrainingRosterRow,
} from "@/lib/adminTraining";
import Link from "next/link";
import {
  LEVEL_LABEL,
  OBJECTIVE_LABEL,
  STATUS_LABEL,
  TRAINING_ZONES,
  todayInBogota,
  type EnrollmentLevel,
  type EnrollmentObjective,
  type WeekStanding,
} from "@/lib/training";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: TrainingRosterRow[] };

const STANDING_CLASS: Record<WeekStanding, string> = {
  good: "bg-tide/15 text-tide",
  warn: "bg-chalk/10 text-chalk",
  bad: "bg-ember/15 text-ember",
  idle: "bg-steel-dim/20 text-steel",
};

const fieldClass =
  "rounded border border-steel-dim/60 bg-ink-raised px-3 py-2 text-sm text-chalk outline-none focus:border-ember";
const primaryButton =
  "rounded bg-ember px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:bg-rust disabled:opacity-60";
const ghostButton =
  "rounded border border-steel-dim/60 px-3 py-2 font-mono text-xs uppercase tracking-wider text-steel transition-colors hover:border-chalk hover:text-chalk";

function errorText(err: unknown, fallback: string): string {
  return err instanceof AdminTrainingApiError ? err.message : fallback;
}

export function AlumnosPageContent() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchTrainingRoster()
      .then((data) => setState({ status: "ready", data }))
      .catch((err) => setState({ status: "error", message: errorText(err, "Error inesperado consultando alumnos.") }));
  }, []);

  useEffect(load, [load]);

  function flash(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(null), 3000);
  }

  return (
    <div className="flex flex-col gap-8">
      <NewStudentForm
        onCreated={(approved) => {
          flash(approved ? "Alumno creado y aprobado — le llegó el correo de acceso." : "Alumno creado como inscripción por aprobar.");
          load();
        }}
      />

      {notice && (
        <p role="status" className="border border-tide/40 bg-tide/10 px-4 py-3 text-sm text-tide">
          {notice}
        </p>
      )}

      {state.status === "loading" && <LoadingBlock />}
      {state.status === "error" && <ErrorBlock message={state.message} />}
      {state.status === "ready" && state.data.length === 0 && (
        <EmptyBlock message="Todavía no hay alumnos. Las inscripciones de /entrenar/plan-diciembre aparecen aquí para aprobarlas." />
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {state.data.map((row) => (
            <StudentCard
              key={row.enrollmentId}
              row={row}
              onActivated={() => {
                flash("Aprobado — le llegó el correo de acceso. Mándale también la invitación por WhatsApp.");
                load();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function StudentCard({ row, onActivated }: { row: TrainingRosterRow; onActivated: () => void }) {
  const [startDate, setStartDate] = useState(row.startDate ?? todayInBogota());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const invite = typeof window === "undefined" ? "" : invitationMessage(row.contactName, window.location.origin);
  const waLink = whatsappLink(row.contactPhone, invite);

  async function approve() {
    setPending(true);
    setError(null);
    try {
      await activateStudent(row.enrollmentId, startDate);
      onActivated();
    } catch (err) {
      setError(errorText(err, "No se pudo aprobar."));
    } finally {
      setPending(false);
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar — usa el botón de WhatsApp.");
    }
  }

  const isPending = row.status === "pending";

  return (
    <li className={`flex flex-col gap-3 border bg-ink-raised p-4 ${isPending ? "border-ember/60" : "border-steel-dim/40"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xl font-black uppercase tracking-tight text-chalk">{row.contactName ?? "Sin nombre"}</p>
          <p className="break-all text-sm text-steel">
            {[row.contactEmail, row.contactPhone].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-steel-dim">
            {[row.objective ? OBJECTIVE_LABEL[row.objective] : null, LEVEL_LABEL[row.level], row.zone].filter(Boolean).join(" · ")}
          </p>
          {row.goal && (
            <p className="mt-1 text-sm text-steel">
              <span className="text-steel-dim">Meta:</span> {row.goal}
            </p>
          )}
        </div>
        <span
          className={`rounded px-2 py-1 font-mono text-[11px] uppercase tracking-wider ${
            isPending ? "bg-ember text-ink" : "bg-steel-dim/20 text-steel"
          }`}
        >
          {STATUS_LABEL[row.status]}
        </span>
      </div>

      {row.currentWeek !== null && !isPending && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-mono text-chalk">
            Semana {row.currentWeek} de {row.weeks} · {row.weekPercent}%
          </span>
          {row.standing && (
            <span className={`rounded px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${STANDING_CLASS[row.standing]}`}>
              {row.standingLabel}
            </span>
          )}
        </div>
      )}
      {row.lastNote && <p className="border-l-2 border-steel-dim/60 pl-3 text-sm text-steel">“{row.lastNote}”</p>}

      <div className="flex flex-wrap items-end gap-3">
        <Link href={`/admin/alumnos/${row.enrollmentId}`} className={primaryButton}>
          Ver ficha y rutina
        </Link>
        {isPending ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Arranca el</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
            </label>
            <button type="button" onClick={approve} disabled={pending || !startDate} className={primaryButton}>
              {pending ? "Aprobando…" : "Aprobar y dar acceso"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={copyInvite} className={ghostButton}>
              {copied ? "¡Copiada!" : "Copiar invitación"}
            </button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={ghostButton}>
                Enviar por WhatsApp
              </a>
            )}
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}
    </li>
  );
}

function NewStudentForm({ onCreated }: { onCreated: (approved: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const approveNow = data.get("approveNow") === "on";
    setPending(true);
    setError(null);
    try {
      await createStudent({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        goal: String(data.get("goal") ?? ""),
        objective: String(data.get("objective") ?? "") as EnrollmentObjective | "",
        level: String(data.get("level") ?? "principiante") as EnrollmentLevel,
        zone: String(data.get("zone") ?? ""),
        startDate: approveNow ? String(data.get("startDate") ?? "") || undefined : undefined,
      });
      form.reset();
      setOpen(false);
      onCreated(approveNow);
    } catch (err) {
      setError(errorText(err, "No se pudo guardar el alumno."));
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${ghostButton} w-fit border-dashed text-ember`}>
        + Nuevo alumno
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 border border-steel-dim/40 bg-ink-raised p-4 sm:grid-cols-2">
      <p className="font-display text-xl font-black uppercase tracking-tight text-chalk sm:col-span-2">Nuevo alumno</p>
      <p className="-mt-2 text-sm text-steel sm:col-span-2">
        Para quien se inscribió en persona. Arranca con la rutina de principiante.
      </p>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Nombre</span>
        <input name="name" required minLength={2} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Correo (con este entra)</span>
        <input name="email" type="email" required className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">WhatsApp</span>
        <input name="phone" type="tel" inputMode="tel" placeholder="300 000 0000" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Meta</span>
        <input name="goal" maxLength={300} placeholder="Ej: mi primera dominada antes de diciembre" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Objetivo principal</span>
        <select name="objective" defaultValue="" className={fieldClass}>
          <option value="">Sin definir</option>
          {Object.entries(OBJECTIVE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Nivel</span>
        <select name="level" defaultValue="principiante" className={fieldClass}>
          {Object.entries(LEVEL_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Zona</span>
        <select name="zone" defaultValue={TRAINING_ZONES[0]} className={fieldClass}>
          {TRAINING_ZONES.map((zone) => (
            <option key={zone}>{zone}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-chalk sm:col-span-2">
        <input name="approveNow" type="checkbox" defaultChecked className="h-4 w-4 accent-ember" />
        Ya pagó: aprobarlo ahora y enviarle el acceso
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Arranca el</span>
        <input name="startDate" type="date" defaultValue={todayInBogota()} className={fieldClass} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-ember sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Guardando…" : "Crear alumno"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={ghostButton}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
