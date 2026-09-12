"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import { toPublicUrl } from "@/lib/publicUrl";
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
            {
              header: "Página",
              // Direct link to where this QR actually lands — Cristian's
              // ask, 2026-09-12, so he doesn't have to request the link
              // every time.
              render: (r) => (
                <a
                  href={toPublicUrl(r.destinationPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tide hover:underline"
                >
                  Abrir ↗
                </a>
              ),
            },
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
