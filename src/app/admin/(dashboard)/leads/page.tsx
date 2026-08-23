import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { StatTile } from "@/components/admin/StatTile";
import { PerformanceTable } from "@/components/admin/PerformanceTable";
import { formatInteger } from "@/lib/format";
import type { OverviewResponse, PerformanceResponse } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Leads" };

/**
 * Section 7 — Leads (FASE 4): totales, por interés (GET .../overview),
 * y por fuente/campaña — reusing the same `sources`/`campaigns`
 * performance endpoints Fuentes uses (each row already carries a
 * `leads` count), instead of a new "leads by source" read model. Interés
 * labels come straight from the `interest` dictionary table
 * (docs/DATA_MODEL.md) — not hardcoded here.
 */
export default function AdminLeadsPage() {
  return (
    <>
      <SectionHeader tag="CRM" title="Leads" description="Totales, por interés, por fuente y por campaña." />
      <div className="flex flex-col gap-10">
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
