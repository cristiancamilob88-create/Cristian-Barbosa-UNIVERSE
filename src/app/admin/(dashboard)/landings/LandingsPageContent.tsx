"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatRatio, formatDuration } from "@/lib/format";
import type { LandingsResponse, LandingRow } from "@/lib/adminAnalytics";

/** Client Component split from page.tsx — see OverviewPageContent.tsx's doc comment for why. */
export function LandingsPageContent() {
  return (
    <AnalyticsBoundary<LandingsResponse> path="landings" isEmpty={(r) => r.data.length === 0}>
      {(res) => (
        <Table<LandingRow>
          keyFor={(row) => row.route}
          columns={[
            { header: "Ruta", render: (r) => r.route },
            { header: "Vistas", align: "right", render: (r) => formatInteger(r.views) },
            { header: "Visitantes únicos", align: "right", render: (r) => formatInteger(r.uniqueVisitors) },
            { header: "Tiempo promedio", align: "right", render: (r) => formatDuration(r.avgDwellSeconds) },
            { header: "Clics en CTA", align: "right", render: (r) => formatInteger(r.ctaClicks) },
            { header: "Registros", align: "right", render: (r) => formatInteger(r.leadConversions) },
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
  );
}
