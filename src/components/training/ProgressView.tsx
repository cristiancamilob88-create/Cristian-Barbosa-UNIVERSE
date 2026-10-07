"use client";

import { useState, type FormEvent } from "react";
import {
  MEASUREMENT_METRICS,
  formatShortDay,
  todayInBogota,
  type Measurement,
  type MeasurementInput,
  type MeasurementKey,
} from "@/lib/training";

/**
 * Max tests over time — flexiones, dominadas, fondos, plancha, peso — as
 * one card per metric (latest value, change since the first test, a small
 * trend line) plus the form to log a new test and the history. Shared by
 * the student's "Mi progreso" and Cristian's student page.
 */

function MiniTrend({ values, dates, label }: { values: number[]; dates: string[]; label: string }) {
  if (values.length < 2) return null;
  const width = 160;
  const height = 44;
  const pad = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-11 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label}: ${values.map((v, i) => `${formatShortDay(dates[i])} ${v}`).join(", ")}`}
    >
      <path d={path} fill="none" stroke="var(--color-ember)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last.x} cy={last.y} r={3.5} fill="var(--color-ember)" />
    </svg>
  );
}

const fieldClass =
  "w-full border border-steel-dim/50 bg-ink px-3 py-2 text-chalk outline-none placeholder:text-steel-dim focus:border-ember";

export function ProgressView({
  measurements,
  onAdd,
  onDelete,
  canEdit,
}: {
  measurements: Measurement[];
  /** Saves a new test; returns the saved row or an error message. */
  onAdd: (input: MeasurementInput) => Promise<Measurement | string>;
  onDelete?: (id: string) => Promise<string | null>;
  canEdit: boolean;
}) {
  const [items, setItems] = useState<Measurement[]>(measurements);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const sorted = [...items].sort((a, b) => (a.measuredOn < b.measuredOn ? -1 : a.measuredOn > b.measuredOn ? 1 : 0));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const num = (key: string) => {
      const raw = String(data.get(key) ?? "").replace(",", ".").trim();
      return raw === "" ? null : Number(raw);
    };
    const input: MeasurementInput = {
      measuredOn: String(data.get("measuredOn") || todayInBogota()),
      pushUps: num("pushUps"),
      pullUps: num("pullUps"),
      dips: num("dips"),
      plankSeconds: num("plankSeconds"),
      weightKg: num("weightKg"),
    };
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await onAdd(input);
    setPending(false);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    setItems((current) => [...current, result]);
    setFormKey((k) => k + 1);
    setNotice("¡Prueba guardada!");
  }

  async function remove(id: string) {
    if (!onDelete) return;
    const err = await onDelete(id);
    if (err) setError(err);
    else setItems((current) => current.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      {sorted.length === 0 ? (
        <p className="border border-dashed border-steel-dim/50 p-5 text-sm text-steel">
          Todavía no hay pruebas. Haz la primera: cuántas flexiones, dominadas y fondos seguidos te salen, y cuántos
          segundos aguantas la plancha. Repítela cada 2–4 semanas y aquí vas a ver cómo subes.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MEASUREMENT_METRICS.map((metric) => {
            const series = sorted.filter((m) => m[metric.key] !== null);
            if (series.length === 0) return null;
            const values = series.map((m) => m[metric.key] as number);
            const first = values[0];
            const latest = values[values.length - 1];
            const delta = Math.round((latest - first) * 10) / 10;
            const better = metric.higherIsBetter ? delta > 0 : delta < 0;
            return (
              <div key={metric.key} className="flex flex-col gap-1 border border-steel-dim/40 bg-ink-raised p-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-steel">{metric.label}</span>
                <span className="font-display text-3xl font-black text-chalk">
                  {latest}
                  <span className="text-base text-steel">{metric.unit}</span>
                </span>
                {series.length > 1 && delta !== 0 && (
                  <span className={`font-mono text-xs ${better ? "text-tide" : "text-steel"}`}>
                    {delta > 0 ? "+" : ""}
                    {delta}
                    {metric.unit} desde la primera
                  </span>
                )}
                <MiniTrend values={values} dates={series.map((m) => m.measuredOn)} label={metric.label} />
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <form key={formKey} onSubmit={submit} className="flex flex-col gap-3 border border-steel-dim/40 bg-ink-raised p-4">
          <p className="font-display text-xl font-black uppercase tracking-tight text-chalk">Nueva prueba de máximo</p>
          <p className="-mt-2 text-sm text-steel">Anota solo lo que hiciste hoy; puedes dejar campos vacíos.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
              <span className="font-mono text-[11px] uppercase tracking-widest text-steel">Fecha</span>
              <input type="date" name="measuredOn" defaultValue={todayInBogota()} className={fieldClass} />
            </label>
            {MEASUREMENT_METRICS.map((metric) => (
              <label key={metric.key} className="flex flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-widest text-steel">
                  {metric.label}
                  {metric.unit && ` (${metric.unit.trim()})`}
                </span>
                <input
                  type="number"
                  name={metric.key satisfies MeasurementKey}
                  min={0}
                  max={metric.max}
                  step={metric.key === "weightKg" ? 0.1 : 1}
                  inputMode={metric.key === "weightKg" ? "decimal" : "numeric"}
                  className={fieldClass}
                />
              </label>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-ember">
              {error}
            </p>
          )}
          {notice && !error && <p className="text-sm text-tide">{notice}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-fit bg-ember px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ink hover:bg-rust disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar prueba"}
          </button>
        </form>
      )}

      {sorted.length > 0 && (
        <div className="overflow-x-auto border border-steel-dim/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-steel-dim/40 text-left font-mono text-[11px] uppercase tracking-widest text-steel">
                <th className="px-3 py-2">Fecha</th>
                {MEASUREMENT_METRICS.map((m) => (
                  <th key={m.key} className="px-3 py-2 text-right">
                    {m.label}
                  </th>
                ))}
                {onDelete && canEdit && <th className="px-3 py-2" aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((m) => (
                <tr key={m.id} className="border-b border-steel-dim/20 last:border-b-0">
                  <td className="whitespace-nowrap px-3 py-2 text-chalk">{formatShortDay(m.measuredOn)}</td>
                  {MEASUREMENT_METRICS.map((metric) => (
                    <td key={metric.key} className="px-3 py-2 text-right font-mono text-chalk">
                      {m[metric.key] ?? "—"}
                    </td>
                  ))}
                  {onDelete && canEdit && (
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="font-mono text-[11px] uppercase tracking-wider text-steel-dim hover:text-ember"
                        aria-label={`Borrar la prueba del ${formatShortDay(m.measuredOn)}`}
                      >
                        Borrar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
