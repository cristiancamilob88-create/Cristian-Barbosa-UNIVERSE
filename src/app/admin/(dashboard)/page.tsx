import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { StatTile } from "@/components/admin/StatTile";
import { Table } from "@/components/admin/Table";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import type { OverviewResponse } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Overview" };

/**
 * Section 1 — Overview (FASE 4). Every number and ratio here comes
 * straight from GET /api/analytics/overview, formatted per
 * docs/KPI_DEFINITIONS.md — nothing computed in this component.
 */
export default function AdminOverviewPage() {
  return (
    <>
      <SectionHeader
        tag="Command Center"
        title="Overview"
        description="Tráfico, conversión y revenue del rango seleccionado — definiciones exactas en docs/KPI_DEFINITIONS.md."
      />
      <AnalyticsBoundary<OverviewResponse> path="overview">
        {({ data, leadsByInterest, social }) => (
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatTile label="Visitantes" value={formatInteger(data.visitors)} />
              <StatTile label="Sesiones" value={formatInteger(data.sessions)} />
              <StatTile label="Page views" value={formatInteger(data.pageViews)} />
              <StatTile label="Landing views" value={formatInteger(data.landingViews)} />
              <StatTile label="CTA clicks" value={formatInteger(data.ctaClicks)} />
              <StatTile label="Social clicks" value={formatInteger(data.socialClicks)} />
              <StatTile label="WhatsApp clicks" value={formatInteger(data.whatsappClicks)} />
              <StatTile label="Leads" value={formatInteger(data.leads)} />
              <StatTile label="Compras" value={formatInteger(data.purchases)} />
              <StatTile label="Revenue" value={formatCents(data.revenueCents)} />
            </div>

            <div>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Ratios de conversión</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatTile label="Visitor → Lead" value={formatRatio(data.ratios.visitorToLead)} />
                <StatTile label="Landing → Lead" value={formatRatio(data.ratios.landingToLead)} />
                <StatTile label="Lead → Purchase" value={formatRatio(data.ratios.leadToPurchase)} />
                <StatTile label="Visitor → Purchase" value={formatRatio(data.ratios.visitorToPurchase)} />
                <StatTile label="CTA → Lead" value={formatRatio(data.ratios.ctaToLead)} />
                <StatTile label="Checkout → Purchase" value={formatRatio(data.ratios.checkoutToPurchase)} />
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Leads por interés</h2>
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

            <div>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">
                Social (resumen — detalle en /admin/social)
              </h2>
              {social.length === 0 ? (
                <p className="text-sm text-steel">Sin clicks salientes todavía en este rango.</p>
              ) : (
                <Table
                  keyFor={(row) => `${row.platform}-${row.slug}`}
                  columns={[
                    { header: "Plataforma", render: (r) => r.platform },
                    { header: "Slug", render: (r) => r.slug },
                    { header: "Clicks", align: "right", render: (r) => formatInteger(r.clicks) },
                    { header: "Visitantes únicos", align: "right", render: (r) => formatInteger(r.uniqueVisitors) },
                  ]}
                  rows={social}
                />
              )}
            </div>
          </div>
        )}
      </AnalyticsBoundary>
    </>
  );
}
