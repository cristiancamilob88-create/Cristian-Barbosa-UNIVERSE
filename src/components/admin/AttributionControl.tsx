"use client";

import type { AttributionMode } from "@/lib/adminAnalytics";

const OPTIONS: { value: AttributionMode; label: string }[] = [
  { value: "first_touch", label: "First touch" },
  { value: "last_touch", label: "Last touch" },
];

/** Toggles GET /api/analytics/revenue's `?attribution=` — first/last-touch only, no multi-touch (docs/ANALYTICS_ENGINE.md). */
export function AttributionControl({ value, onChange }: { value: AttributionMode; onChange: (mode: AttributionMode) => void }) {
  return (
    <div className="flex items-center gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
            value === option.value
              ? "border-ember bg-ember text-ink"
              : "border-steel-dim/60 text-steel hover:border-steel hover:text-chalk"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
