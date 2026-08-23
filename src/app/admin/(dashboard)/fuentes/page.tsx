import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { PerformanceTable } from "@/components/admin/PerformanceTable";
import type { PerformanceResponse } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Fuentes" };

/**
 * Section 2 — Adquisición (FASE 4, extended in Block 04.1): de dónde
 * viene la audiencia, por source, campaign, y (Block 04.1) medium —
 * `getPerformanceByDimension()` (src/server/analytics/performance.ts)
 * is already source-extensible (a new platform is a `source` dictionary
 * row, never new code — see docs/COMMAND_CENTER.md, "Adding a new
 * source"), and now covers `medium` too (a free-text dimension, not a
 * dictionary table — same function, no join).
 */
export default function AdminFuentesPage() {
  return (
    <>
      <SectionHeader
        tag="Adquisición"
        title="Fuentes, campañas y medium"
        description="¿De dónde viene la audiencia? Instagram, Facebook, TikTok, YouTube, WhatsApp, Google, eventos, QR, referidos — qué campaña y qué medium específico."
      />
      <div className="flex flex-col gap-10">
        <div>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por fuente (source)</h2>
          <AnalyticsBoundary<PerformanceResponse> path="sources" isEmpty={(r) => r.data.length === 0}>
            {(res) => <PerformanceTable rows={res.data} labelHeader="Fuente" />}
          </AnalyticsBoundary>
        </div>
        <div>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por campaña</h2>
          <AnalyticsBoundary<PerformanceResponse> path="campaigns" isEmpty={(r) => r.data.length === 0}>
            {(res) => <PerformanceTable rows={res.data} labelHeader="Campaña" />}
          </AnalyticsBoundary>
        </div>
        <div>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por medium</h2>
          <AnalyticsBoundary<PerformanceResponse> path="medium" isEmpty={(r) => r.data.length === 0}>
            {(res) => <PerformanceTable rows={res.data} labelHeader="Medium" />}
          </AnalyticsBoundary>
        </div>
      </div>
    </>
  );
}
