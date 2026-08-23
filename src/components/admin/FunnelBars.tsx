import { formatInteger, formatRatio } from "@/lib/format";
import type { FunnelStepResult } from "@/lib/adminAnalytics";

/**
 * Plain CSS bar-width funnel — no chart library, no animation (FASE 13:
 * "no diseño visual avanzado"). Bar width is relative to the first
 * step's volume so drop-off is visible at a glance. The single biggest
 * drop-off step (Block 04.1 — "¿qué punto del funnel pierde usuarios?")
 * gets a rust-colored conversion label instead of steel, so the answer
 * doesn't require reading every number and comparing them by hand.
 */
export function FunnelBars({ steps }: { steps: FunnelStepResult[] }) {
  const max = steps[0]?.visitors ?? 0;

  // The step with the lowest conversionFromPrevious (excluding the first,
  // which has none) is where the funnel loses the most people.
  let worstDropIndex = -1;
  let worstDropRate = Infinity;
  steps.forEach((step, i) => {
    if (i === 0 || step.conversionFromPrevious === null) return;
    if (step.conversionFromPrevious < worstDropRate) {
      worstDropRate = step.conversionFromPrevious;
      worstDropIndex = i;
    }
  });

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const widthPct = max > 0 ? Math.max((step.visitors / max) * 100, 2) : 0;
        const isWorstDrop = i === worstDropIndex;
        return (
          <li key={step.event + i}>
            <div className="mb-1 flex items-baseline justify-between font-mono text-xs uppercase tracking-wider text-steel">
              <span>
                {step.name}
                {isWorstDrop && <span className="ml-2 text-rust">▼ mayor caída</span>}
              </span>
              <span className="text-chalk">
                {formatInteger(step.visitors)}
                {i > 0 && (
                  <span className={`ml-2 ${isWorstDrop ? "text-rust" : "text-steel"}`}>
                    ({formatRatio(step.conversionFromPrevious)} vs. anterior)
                  </span>
                )}
              </span>
            </div>
            <div className="h-6 w-full rounded bg-ink-raised">
              <div
                className={`h-6 rounded transition-[width] ${isWorstDrop ? "bg-rust" : "bg-ember"}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
