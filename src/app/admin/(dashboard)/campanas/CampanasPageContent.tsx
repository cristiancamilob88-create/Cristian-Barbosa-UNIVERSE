"use client";

import Link from "next/link";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import type { CampaignDetailResponse, CampaignDetailRow } from "@/lib/adminAnalytics";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  archived: "Archivada",
};

/**
 * One row per registered `campaign` — same "never hardcode a name"
 * discipline as /admin/qr (docs/COMMAND_CENTER.md, "QR is never
 * hardcoded"): every campaign that exists in the database shows up
 * automatically. Each row links to `/admin/campanas/[slug]` for the
 * focused, single-campaign view (Cristian's ask, 2026-08-28 — "una
 * analítica específica sobre... Concordia").
 */
export function CampanasPageContent() {
  return (
    <AnalyticsBoundary<CampaignDetailResponse> path="campaign-detail" isEmpty={(r) => r.data.length === 0}>
      {(res) => (
        <Table<CampaignDetailRow>
          keyFor={(row) => row.campaignSlug}
          columns={[
            {
              header: "Campaña",
              render: (r) => (
                <Link href={`/admin/campanas/${r.campaignSlug}`} className="text-ember hover:underline">
                  {r.campaignName}
                </Link>
              ),
            },
            { header: "Estado", render: (r) => STATUS_LABEL[r.status] ?? r.status },
            { header: "Visitas", align: "right", render: (r) => formatInteger(r.visits) },
            { header: "Vistas de página", align: "right", render: (r) => formatInteger(r.landingViews) },
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
