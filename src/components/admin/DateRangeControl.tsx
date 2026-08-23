"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DateRangePreset } from "@/lib/adminAnalytics";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
];

/**
 * The one date-filter control every /admin section renders — writes
 * `range` or `from`/`to` into the URL's own search params (read back by
 * useRangeFromSearchParams, src/components/admin/useAnalyticsQuery.ts),
 * which are exactly the params src/server/analytics/dateRange.ts already
 * parses server-side. One implementation, one source of truth
 * (docs/COMMAND_CENTER.md, "Date filters") — no page computes a date
 * range itself.
 */
export function DateRangeControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const activePreset = fromParam ? null : ((searchParams.get("range") as DateRangePreset | null) ?? "30d");

  const [customOpen, setCustomOpen] = useState(Boolean(fromParam));
  const [fromValue, setFromValue] = useState(fromParam ?? "");
  const [toValue, setToValue] = useState(searchParams.get("to") ?? "");

  function applyPreset(preset: DateRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.set("range", preset);
    router.replace(`${pathname}?${params.toString()}`);
    setCustomOpen(false);
  }

  function applyCustom(event: FormEvent) {
    event.preventDefault();
    if (!fromValue) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("range");
    params.set("from", fromValue);
    if (toValue) {
      params.set("to", toValue);
    } else {
      params.delete("to");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => applyPreset(preset.value)}
          className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
            activePreset === preset.value
              ? "border-ember bg-ember text-ink"
              : "border-steel-dim/60 text-steel hover:border-steel hover:text-chalk"
          }`}
        >
          {preset.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setCustomOpen((open) => !open)}
        className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
          activePreset === null
            ? "border-ember bg-ember text-ink"
            : "border-steel-dim/60 text-steel hover:border-steel hover:text-chalk"
        }`}
      >
        Rango
      </button>
      {customOpen && (
        <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
            required
            aria-label="Desde"
            className="rounded border border-steel-dim/60 bg-ink-raised px-2 py-1 text-xs text-chalk"
          />
          <span className="text-xs text-steel">→</span>
          <input
            type="date"
            value={toValue}
            onChange={(e) => setToValue(e.target.value)}
            aria-label="Hasta"
            className="rounded border border-steel-dim/60 bg-ink-raised px-2 py-1 text-xs text-chalk"
          />
          <button
            type="submit"
            className="rounded border border-ember px-3 py-1 font-mono text-xs uppercase tracking-wider text-ember transition-colors hover:bg-ember hover:text-ink"
          >
            Aplicar
          </button>
        </form>
      )}
    </div>
  );
}
