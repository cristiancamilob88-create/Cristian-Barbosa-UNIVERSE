import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { StatTile } from "@/components/admin/StatTile";
import { PerformanceTable } from "@/components/admin/PerformanceTable";
import { formatInteger, formatDateTime } from "@/lib/format";
import type { OverviewResponse, PerformanceResponse, LeadsResponse, RecentLeadRow } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Leads" };

const STATUS_LABEL: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  won: "Ganado",
  lost: "Perdido",
};

/**
 * Section 7 — Leads (FASE 4, extended in Block 04.1 with a real
 * activity list): totales, por interés (GET .../overview), por fuente/
 * campaña — reusing the same `sources`/`campaigns` performance endpoints
 * Fuentes uses (each row already carries a `leads` count) — and now
 * (Block 04.1) the individual leads themselves via GET
 * /api/analytics/leads. No PII (no name/email — see getRecentLeads()'s
 * own doc comment); topic/interest/source/campaign/qr/medium/fecha only.
 */
export default function AdminLeadsPage() {
  return (
    <>
      <SectionHeader tag="CRM" title="Leads" description="Actividad reciente, totales, por interés, por fuente y por campaña." />
      <div className="flex flex-col gap-10">
        <div>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Actividad reciente</h2>
          <AnalyticsBoundary<LeadsResponse> path="leads" isEmpty={(r) => r.data.length === 0}>
            {(res) => (
              <Table<RecentLeadRow>
                keyFor={(row) => row.id}
                columns={[
                  { header: "Fecha", render: (r) => formatDateTime(r.createdAt) },
                  { header: "Tema", render: (r) => r.topicRaw },
                  { header: "Interés", render: (r) => r.interestLabel ?? "—" },
                  { header: "Fuente", render: (r) => r.sourceLabel ?? "—" },
                  { header: "Campaña", render: (r) => r.campaignLabel ?? "—" },
                  { header: "QR", render: (r) => r.qrSlug ?? "—" },
                  { header: "Estado", render: (r) => STATUS_LABEL[r.status] ?? r.status },
                ]}
                rows={res.data}
              />
            )}
          </AnalyticsBoundary>
        </div>

        <AnalyticsBoundary<OverviewResponse> path="overview">
          {({ data, leadsByInterest }) => (
            <div className="flex flex-col gap-6">
              <StatTile label="Leads totales" value={formatInteger(data.leads)} />
              <div>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por interés</h2>
                {leadsByInterest.length === 0 ? (
                  <p className="text-sm text-steel">Sin leads todavía en este rango.</p>
                ) : (
                  <Table
                    keyFor={(row) => row.key ?? "none"}
                    columns={[
                      { header: "Interés", render: (r) => r.label },
                      { header: "Leads", align: "right", render: (r) => formatInteger(r.leads) },
                    ]}
                    rows={leadsByInterest}
                  />
                )}
              </div>
            </div>
          )}
        </AnalyticsBoundary>

        <div>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por fuente</h2>
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
