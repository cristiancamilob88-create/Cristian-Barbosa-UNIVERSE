import { formatInteger, formatRatio } from "@/lib/format";
import type { FunnelStepResult } from "@/lib/adminAnalytics";

/**
 * Plain CSS bar-width funnel — no chart library, no animation (FASE 13:
 * "no diseño visual avanzado"). Bar width is relative to the first
 * step's volume so drop-off is visible at a glance.
 */
export function FunnelBars({ steps }: { steps: FunnelStepResult[] }) {
  const max = steps[0]?.visitors ?? 0;

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const widthPct = max > 0 ? Math.max((step.visitors / max) * 100, 2) : 0;
        return (
          <li key={step.event + i}>
            <div className="mb-1 flex items-baseline justify-between font-mono text-xs uppercase tracking-wider text-steel">
              <span>{step.name}</span>
              <span className="text-chalk">
                {formatInteger(step.visitors)}
                {i > 0 && <span className="ml-2 text-steel">({formatRatio(step.conversionFromPrevious)} vs. anterior)</span>}
              </span>
            </div>
            <div className="h-6 w-full rounded bg-ink-raised">
              <div className="h-6 rounded bg-ember transition-[width]" style={{ width: `${widthPct}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
