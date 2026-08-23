import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  /** Optional "vs. período anterior" badge (DeltaBadge) — omitted where no comparison exists. */
  delta?: ReactNode;
}) {
  return (
    <div className="rounded border border-steel-dim/40 bg-ink-raised px-5 py-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-steel">{label}</p>
      <p className="mt-1 font-display text-3xl font-black text-chalk">{value}</p>
      {sub && <p className="mt-1 text-xs text-steel">{sub}</p>}
      {delta && <div className="mt-1">{delta}</div>}
    </div>
  );
}
