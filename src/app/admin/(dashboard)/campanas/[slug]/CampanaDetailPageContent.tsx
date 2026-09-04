"use client";

import { useParams } from "next/navigation";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { StatTile } from "@/components/admin/StatTile";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import type { CampaignDetailResponse } from "@/lib/adminAnalytics";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  archived: "Archivada",
};

/**
 * The focused, single-campaign view Cristian asked for (2026-08-28):
 * "cómo nos va en Concordia", separate from the general dashboard.
 * Reuses the exact same `/api/analytics/campaign-detail` response the
 * list page (`../CampanasPageContent.tsx`) fetches — no second query,
 * this just picks its one row out of it by the URL's `[slug]`. Same
 * stat-tile layout as the Overview page (`StatTile`) so a single
 * campaign reads like a mini dashboard, not a table row squinted at.
 */
export function CampanaDetailPageContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  return (
    <AnalyticsBoundary<CampaignDetailResponse> path="campaign-detail">
      {(res) => {
        const row = res.data.find((r) => r.campaignSlug === slug);
        if (!row) {
          return (
            <p className="rounded border border-dashed border-steel-dim/50 px-6 py-10 text-center text-sm text-steel">
              No existe una campaña registrada con el slug &quot;{slug}&quot;.
            </p>
          );
        }

        return (
          <div className="flex flex-col gap-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">
                {STATUS_LABEL[row.status] ?? row.status}
              </p>
              <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-chalk sm:text-4xl">
                {row.campaignName}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatTile label="Visitas" value={formatInteger(row.visits)} />
              <StatTile label="Vistas de página" value={formatInteger(row.landingViews)} />
              <StatTile label="Clics en CTA" value={formatInteger(row.ctaClicks)} />
              <StatTile label="Clics a WhatsApp" value={formatInteger(row.whatsappClicks)} />
              <StatTile label="Registros" value={formatInteger(row.leads)} />
              <StatTile label="Compras" value={formatInteger(row.purchases)} />
              <StatTile label="Ingresos" value={formatCents(row.revenueCents)} />
              <StatTile
                label="Visita → Registro"
                value={formatRatio(row.visits > 0 ? row.leads / row.visits : null)}
              />
            </div>
          </div>
        );
      }}
    </AnalyticsBoundary>
  );
}
