/**
 * An inline magnitude bar behind a table cell's number — turns a column
 * of numbers into something scannable at a glance without leaving the
 * table (dataviz: magnitude comparison across categories is a bar
 * chart's job; this is that chart, collapsed into the cell it already
 * had). Single hue (steel, the neutral — not ember, which stays
 * reserved for the one "current/primary" emphasis elsewhere, e.g.
 * Sparkline) since every bar in one column is the same series.
 */
export function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <span className="relative block h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-steel-dim/20" aria-hidden="true">
      <span className="absolute inset-y-0 left-0 rounded-full bg-steel-dim/70" style={{ width: `${pct}%` }} />
    </span>
  );
}
