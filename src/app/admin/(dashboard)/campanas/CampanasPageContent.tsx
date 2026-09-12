"use client";

import Link from "next/link";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import { toPublicUrl } from "@/lib/publicUrl";
import type { CampaignDetailResponse, CampaignDetailRow } from "@/lib/adminAnalytics";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  archived: "Archivada",
};

/**
 * Direct links to the campaign's live page(s) — Cristian's ask,
 * 2026-09-12: he kept having to request the link every time. Usually 0
 * or 1 path (see CampaignDetailRow.destinationPaths' own doc comment
 * for why it's an array), so this renders plainly for the common case
 * and only stacks links when a campaign really has more than one.
 */
function CampaignPageLinks({ paths }: { paths: string[] }) {
  if (paths.length === 0) return <span className="text-steel">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {paths.map((path) => (
        <a
          key={path}
          href={toPublicUrl(path)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-tide hover:underline"
        >
          Abrir ↗
        </a>
      ))}
    </div>
  );
}

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
            {
              header: "Página",
              render: (r) => <CampaignPageLinks paths={r.destinationPaths} />,
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
