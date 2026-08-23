import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import type { QrResponse, QrPerformanceRow } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "QR" };

/**
 * Section 4 — QR performance (FASE 4). One row per registered
 * `qr_source` — no code names a specific QR ("Aura") anywhere in this
 * page; every code that exists in the database shows up automatically
 * (docs/COMMAND_CENTER.md, "QR is never hardcoded").
 */
export default function AdminQrPage() {
  return (
    <>
      <SectionHeader
        tag="Físico → digital"
        title="QR performance"
        description="Shows, universidades, colegios, ferias, eventos — cada código registrado, de scan a compra."
      />
      <AnalyticsBoundary<QrResponse> path="qr" isEmpty={(r) => r.data.length === 0}>
        {(res) => (
          <Table<QrPerformanceRow>
            keyFor={(row) => row.qrSlug}
            columns={[
              { header: "QR", render: (r) => r.qrSlug },
              { header: "Destino", render: (r) => r.destinationPath },
              { header: "Activo", render: (r) => (r.active ? "Sí" : "No") },
              { header: "Scans", align: "right", render: (r) => formatInteger(r.visits) },
              { header: "Landing views", align: "right", render: (r) => formatInteger(r.landingViews) },
              { header: "CTA clicks", align: "right", render: (r) => formatInteger(r.ctaClicks) },
              { header: "WhatsApp clicks", align: "right", render: (r) => formatInteger(r.whatsappClicks) },
              { header: "Leads", align: "right", render: (r) => formatInteger(r.leads) },
              { header: "Compras", align: "right", render: (r) => formatInteger(r.purchases) },
              { header: "Revenue", align: "right", render: (r) => formatCents(r.revenueCents) },
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
    </>
  );
}
