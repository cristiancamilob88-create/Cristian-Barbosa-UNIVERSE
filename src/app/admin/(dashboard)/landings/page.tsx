import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatRatio } from "@/lib/format";
import type { LandingsResponse, LandingRow } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Landings" };

/**
 * Section 5 — Landing performance (FASE 4). One row per `route` value
 * actually seen in `interaction` — works for every current pillar route
 * and any future one automatically, nothing here lists `/entrenar`,
 * `/musica`, etc. by name (docs/COMMAND_CENTER.md, "Routes are never
 * hardcoded").
 */
export default function AdminLandingsPage() {
  return (
    <>
      <SectionHeader
        tag="Landings"
        title="Rendimiento por ruta"
        description="Views, visitantes únicos, CTA clicks y conversión a lead/compra — atribuido a la primera ruta en la que entró cada contacto."
      />
      <AnalyticsBoundary<LandingsResponse> path="landings" isEmpty={(r) => r.data.length === 0}>
        {(res) => (
          <Table<LandingRow>
            keyFor={(row) => row.route}
            columns={[
              { header: "Ruta", render: (r) => r.route },
              { header: "Views", align: "right", render: (r) => formatInteger(r.views) },
              { header: "Visitantes únicos", align: "right", render: (r) => formatInteger(r.uniqueVisitors) },
              { header: "CTA clicks", align: "right", render: (r) => formatInteger(r.ctaClicks) },
              { header: "Leads", align: "right", render: (r) => formatInteger(r.leadConversions) },
              { header: "Compras", align: "right", render: (r) => formatInteger(r.purchaseConversions) },
              {
                header: "Conversión",
                align: "right",
                render: (r) => formatRatio(r.uniqueVisitors > 0 ? r.leadConversions / r.uniqueVisitors : null),
              },
            ]}
            rows={res.data}
          />
        )}
      </AnalyticsBoundary>
    </>
  );
}
