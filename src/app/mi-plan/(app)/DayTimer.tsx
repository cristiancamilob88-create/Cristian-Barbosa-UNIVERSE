"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/training";

interface Props {
  week: number;
  dayIndex: number;
  /** What's saved for this day, if the student already timed it. */
  durationSeconds: number | null;
  readOnly: boolean;
  /** Persists the result; returns an error message or null. */
  onFinish: (seconds: number) => Promise<string | null>;
}

const MAX_SECONDS = 6 * 3600;

function storageKey(week: number, dayIndex: number) {
  return `cb-timer:${week}:${dayIndex}`;
}

function readStart(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStart(key: string, value: number | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(value));
  } catch {
    // Private mode / storage blocked: the timer still works while the page stays open.
  }
}

/**
 * The workout timer for one day of the routine (docs/TRAINING.md):
 * "Empezar" → a running clock → "Terminé" saves how long it took. The
 * start time lives in localStorage, so locking the phone or reloading
 * mid-workout doesn't lose it; nothing is sent until they finish.
 */
export function DayTimer({ week, dayIndex, durationSeconds, readOnly, onFinish }: Props) {
  const key = storageKey(week, dayIndex);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);

  // Restore a timer left running (reload, phone locked) — client-only.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage is only possible after mount
    setStartedAt(readStart(key));
  }, [key]);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  function start() {
    const t = Date.now();
    writeStart(key, t);
    setStartedAt(t);
    setNow(t);
  }

  function cancel() {
    writeStart(key, null);
    setStartedAt(null);
  }

  async function finish() {
    if (startedAt === null) return;
    const seconds = Math.min(Math.max(Math.round((Date.now() - startedAt) / 1000), 1), MAX_SECONDS);
    setSaving(true);
    const error = await onFinish(seconds);
    setSaving(false);
    if (!error) cancel();
  }

  const button =
    "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors disabled:opacity-60";

  if (startedAt !== null) {
    return (
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="font-mono text-lg text-ember" aria-label="Tiempo transcurrido">
          ⏱ {formatDuration((now - startedAt) / 1000)}
        </span>
        <button type="button" onClick={finish} disabled={saving} className={`${button} border-ember bg-ember text-ink`}>
          {saving ? "Guardando…" : "Terminé"}
        </button>
        <button type="button" onClick={cancel} disabled={saving} className={`${button} border-steel-dim/50 text-steel`}>
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {durationSeconds !== null && (
        <span className="font-mono text-sm text-tide">Terminaste en {formatDuration(durationSeconds)}</span>
      )}
      {!readOnly && (
        <button type="button" onClick={start} className={`${button} border-steel-dim/50 text-chalk hover:border-ember`}>
          {durationSeconds !== null ? "⏱ Medir de nuevo" : "⏱ Empezar rutina"}
        </button>
      )}
    </div>
  );
}
