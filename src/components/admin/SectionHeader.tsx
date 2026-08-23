import type { ReactNode } from "react";
import { DateRangeControl } from "./DateRangeControl";

/** Shared header for every /admin section: title + description + the one date-range control. */
export function SectionHeader({ tag, title, description, extra }: { tag: string; title: string; description: string; extra?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-steel-dim/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">{tag}</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-chalk sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-steel">{description}</p>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <DateRangeControl />
        {extra}
      </div>
    </div>
  );
}
