import type { ReactNode } from "react";

/** One numbered section of a legal page (/privacidad, /terminos) — plain, readable prose. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-steel-dim/40 py-8">
      <h2 className="font-display text-xl font-black uppercase tracking-tight text-chalk">{title}</h2>
      <div className="mt-4 flex max-w-3xl flex-col gap-3 text-sm leading-relaxed text-steel [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-chalk">
        {children}
      </div>
    </section>
  );
}
