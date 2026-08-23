"use client";

/**
 * A single-series trend line — "evolución temporal" (Block 04.1). Plain
 * inline SVG, no charting library (unjustified for one line): thin 2px
 * stroke, a 4px rounded end on the last point (today's value, the one
 * that matters most), recessive gridline at the baseline only. One hue
 * (ember, the brand's single accent) since this is always exactly one
 * series — dataviz's own rule ("sequential = one hue") applies directly,
 * and a legend would be redundant with the chart's own title.
 *
 * Interaction is intentionally light: native `<title>` per-point
 * tooltips (zero extra JS, works with keyboard/touch/screen readers)
 * instead of a custom crosshair overlay — this block's own scope note
 * ("motion sutil, no 3D/animación avanzada") reads the same way for
 * interaction complexity.
 */
export function Sparkline({
  points,
  formatValue,
  height = 64,
}: {
  points: { date: string; value: number }[];
  formatValue: (value: number) => string;
  height?: number;
}) {
  if (points.length === 0) return null;

  const width = Math.max(points.length * 12, 120);
  const max = Math.max(...points.map((p) => p.value), 1);
  const padding = 6;
  const plotHeight = height - padding * 2;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? width / 2 : (i / (points.length - 1)) * width;
    const y = padding + plotHeight - (p.value / max) * plotHeight;
    return { ...p, x, y };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`Evolución: ${points.map((p) => `${p.date} ${formatValue(p.value)}`).join(", ")}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {/* Recessive baseline only — not a full grid, per "primero claridad". */}
      <line x1={0} y1={height - padding} x2={width} y2={height - padding} stroke="var(--color-steel-dim)" strokeWidth={1} opacity={0.4} />
      <path d={path} fill="none" stroke="var(--color-ember)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c) => (
        <circle key={c.date} cx={c.x} cy={c.y} r={c === last ? 3.5 : 2} fill="var(--color-ember)" opacity={c === last ? 1 : 0.55}>
          <title>
            {c.date}: {formatValue(c.value)}
          </title>
        </circle>
      ))}
    </svg>
  );
}
