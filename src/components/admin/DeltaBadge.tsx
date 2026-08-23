/**
 * "vs. período anterior" — Block 04.1. Renders a signed percentage
 * change, or an honest fallback when the previous period has nothing to
 * compare against (never a fabricated 0%/∞%, per "nunca inventar
 * métricas").
 */
export function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return (
      <span className="font-mono text-xs text-steel">{current > 0 ? "Nuevo" : "— vs. anterior"}</span>
    );
  }

  const change = (current - previous) / previous;
  const pct = Math.round(Math.abs(change) * 100);
  const isUp = change > 0;
  const isFlat = change === 0;

  return (
    <span
      className={`font-mono text-xs ${isFlat ? "text-steel" : isUp ? "text-ember" : "text-steel"}`}
      title={`Período anterior: ${previous}`}
    >
      {isFlat ? "=" : isUp ? "↑" : "↓"} {pct}% vs. anterior
    </span>
  );
}
