import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { PerformanceTable } from "@/components/admin/PerformanceTable";
import type { PerformanceResponse } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Fuentes" };

/**
 * Section 2 — Adquisición (FASE 4): de dónde viene la audiencia, por
 * source y por campaign — `getPerformanceByDimension()`
 * (src/server/analytics/performance.ts) is already source-extensible
 * (a new platform is a `source` dictionary row, never new code — see
 * docs/COMMAND_CENTER.md, "Adding a new source"). `medium` doesn't have
 * its own performance read model in Block 03 (only source/campaign/qr
 * do) — see docs/COMMAND_CENTER.md, "What's not built yet" for why this
 * page doesn't invent one.
 */
export default function AdminFuentesPage() {
  return (
    <>
      <SectionHeader
        tag="Adquisición"
        title="Fuentes y campañas"
        description="¿De dónde viene la audiencia? Instagram, Facebook, TikTok, YouTube, WhatsApp, Google, eventos, QR, referidos — y qué campaña específica."
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
      </div>
    </>
  );
}
