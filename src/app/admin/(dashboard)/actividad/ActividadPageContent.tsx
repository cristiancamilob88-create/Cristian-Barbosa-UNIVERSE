"use client";

import { useState } from "react";
import { StatTile } from "@/components/admin/StatTile";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "@/components/admin/states";
import { useAnalyticsQueryForRange } from "@/components/admin/useAnalyticsQuery";
import {
  bogotaDayRange,
  describeStep,
  formatBogotaTime,
  originLabel,
  summarizeActivity,
  visitDurationLabel,
  visitorInterest,
  type ActivityResponse,
  type ActivityVisitor,
  type StepTone,
} from "@/lib/adminActivity";

const DAYS = [
  { daysAgo: 0, label: "Hoy" },
  { daysAgo: 1, label: "Ayer" },
  { daysAgo: 2, label: "Anteayer" },
] as const;

const TONE_CLASS: Record<StepTone, string> = {
  view: "text-steel",
  click: "text-ember",
  out: "text-tide",
  win: "font-semibold text-[#ffc857]",
};

/** Client Component split from page.tsx — see OverviewPageContent.tsx's doc comment for why. */
export function ActividadPageContent() {
  const [daysAgo, setDaysAgo] = useState<number>(0);
  const [refresh, setRefresh] = useState(0);
  // Recomputed per render so "Hoy" always ends at the current minute;
  // `refresh` is passed through so "Actualizar" re-fetches on demand.
  const range = bogotaDayRange(daysAgo);
  const state = useAnalyticsQueryForRange<ActivityResponse>(
    "activity",
    { from: range.from, to: daysAgo === 0 ? undefined : range.to },
    { refresh: String(refresh) },
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2">
        {DAYS.map((day) => (
          <button
            key={day.daysAgo}
            type="button"
            onClick={() => setDaysAgo(day.daysAgo)}
            className={`rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              daysAgo === day.daysAgo ? "bg-ember text-ink" : "border border-steel-dim/50 text-steel hover:text-chalk"
            }`}
          >
            {day.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRefresh((n) => n + 1)}
          className="ml-auto rounded border border-steel-dim/50 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-steel hover:text-chalk"
        >
          Actualizar
        </button>
      </div>

      {state.status === "loading" && <LoadingBlock />}
      {state.status === "error" && <ErrorBlock message={state.message} />}
      {state.status === "ready" &&
        (state.data.data.length === 0 ? (
          <EmptyBlock message="Nadie ha entrado todavía en este día." />
        ) : (
          <ActivityBody visitors={state.data.data} truncated={state.data.truncated} />
        ))}
    </div>
  );
}

function ActivityBody({ visitors, truncated }: { visitors: ActivityVisitor[]; truncated: boolean }) {
  const summary = summarizeActivity(visitors);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Personas" value={String(summary.people)} sub="celulares o computadores distintos" />
        <StatTile label="Páginas abiertas" value={String(summary.pages)} />
        <StatTile label="Botones tocados" value={String(summary.buttons)} sub={summary.payTaps ? `${summary.payTaps} tocaron pagar` : undefined} />
        <StatTile
          label="WhatsApp / redes"
          value={String(summary.whatsapp + summary.socials)}
          sub={`${summary.whatsapp} WhatsApp · ${summary.socials} redes`}
        />
      </div>

      <div className="rounded border border-steel-dim/40 bg-ink-raised px-5 py-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-steel">De dónde vinieron</p>
        <p className="mt-2 text-sm text-chalk">
          {summary.bySource.map(([source, n]) => `${source}: ${n}`).join(" · ")}
        </p>
        {summary.byInterest.length > 0 && (
          <p className="mt-2 text-sm text-chalk">
            <span className="text-steel">Lo que más les interesó: </span>
            {summary.byInterest.map(([area, n]) => `${area} (${n})`).join(" · ")}
          </p>
        )}
        {summary.wins > 0 && (
          <p className="mt-2 text-sm font-semibold text-[#ffc857]">
            {summary.wins} {summary.wins === 1 ? "persona dejó sus datos o compró" : "personas dejaron sus datos o compraron"} — revisa Registros e Ingresos.
          </p>
        )}
        <p className="mt-3 text-xs text-steel">
          &quot;Sin origen&quot; = entró por un link sin etiqueta (Instagram, Facebook y TikTok esconden de dónde viene la gente). Comparte siempre el link con utm_source para saberlo.
        </p>
      </div>

      {truncated && (
        <p className="text-xs text-rust">Mucho movimiento: se muestran solo los primeros eventos del día.</p>
      )}

      <ol className="flex flex-col gap-4">
        {visitors.map((visitor) => (
          <li key={visitor.label} className="rounded border border-steel-dim/40 bg-ink-raised px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-lg font-black uppercase tracking-tight text-chalk">
                {visitor.label}
                {visitor.isContact && <span className="ml-2 font-mono text-xs text-[#ffc857]">· dejó sus datos</span>}
              </p>
              <p className="font-mono text-xs text-steel">
                {formatBogotaTime(visitor.firstAt)}
                {visitor.lastAt !== visitor.firstAt && ` – ${formatBogotaTime(visitor.lastAt)}`}
              </p>
            </div>
            <p className="mt-1 text-xs text-steel">
              Vino de: <span className="text-chalk">{originLabel(visitor)}</span> · {visitDurationLabel(visitor)}
            </p>
            <VisitorInterest visitor={visitor} />
            <ul className="mt-3 flex flex-col gap-1.5 border-l border-steel-dim/40 pl-4">
              {visitor.steps.map((step, i) => {
                const { text, tone } = describeStep(step);
                return (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-16 shrink-0 font-mono text-xs text-steel-dim">{formatBogotaTime(step.at)}</span>
                    <span className={TONE_CLASS[tone]}>{text}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}

function VisitorInterest({ visitor }: { visitor: ActivityVisitor }) {
  const { area, signals } = visitorInterest(visitor);
  if (!area && signals.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {area && (
        <span className="text-chalk">
          <span className="text-steel">Le interesó:</span> <strong>{area}</strong>
        </span>
      )}
      {signals.map((signal) => (
        <span key={signal} className="rounded-full border border-[#ffc857]/60 px-2 py-0.5 font-semibold text-[#ffc857]">
          {signal}
        </span>
      ))}
    </div>
  );
}
