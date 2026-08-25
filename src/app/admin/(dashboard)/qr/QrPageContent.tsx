"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import type { QrResponse, QrPerformanceRow } from "@/lib/adminAnalytics";

/** Client Component split from page.tsx — see OverviewPageContent.tsx's doc comment for why. */
export function QrPageContent() {
  return (
    <AnalyticsBoundary<QrResponse> path="qr" isEmpty={(r) => r.data.length === 0}>
      {(res) => (
        <Table<QrPerformanceRow>
          keyFor={(row) => row.qrSlug}
          columns={[
            { header: "QR", render: (r) => r.qrSlug },
            { header: "Destino", render: (r) => r.destinationPath },
            { header: "Activo", render: (r) => (r.active ? "Sí" : "No") },
            { header: "Escaneos", align: "right", render: (r) => formatInteger(r.visits) },
            { header: "Visitas con origen", align: "right", render: (r) => formatInteger(r.landingViews) },
            { header: "Clics en CTA", align: "right", render: (r) => formatInteger(r.ctaClicks) },
            { header: "Clics a WhatsApp", align: "right", render: (r) => formatInteger(r.whatsappClicks) },
            { header: "Registros", align: "right", render: (r) => formatInteger(r.leads) },
            { header: "Compras", align: "right", render: (r) => formatInteger(r.purchases) },
            { header: "Ingresos", align: "right", render: (r) => formatCents(r.revenueCents) },
            {
              header: "Conversión",
              align: "right",
              render: (r) => formatRatio(r.visits > 0 ? r.leads / r.visits : null),
            },
          ]}
          rows={res.data}
        />
      )}
    </AnalyticsBoundary>
  );
}
