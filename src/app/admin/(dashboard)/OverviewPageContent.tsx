"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { StatTile } from "@/components/admin/StatTile";
import { Table } from "@/components/admin/Table";
import { Sparkline } from "@/components/admin/Sparkline";
import { DeltaBadge } from "@/components/admin/DeltaBadge";
import { formatInteger, formatCents, formatRatio, formatDuration } from "@/lib/format";
import type { OverviewResponse } from "@/lib/adminAnalytics";
import { OverviewComparison } from "./OverviewComparison";

/**
 * Every number and ratio comes straight from GET /api/analytics/overview,
 * formatted per docs/KPI_DEFINITIONS.md — nothing computed in this
 * component beyond the delta percentage (a single division, see
 * DeltaBadge) and the sparkline's own pixel geometry (Sparkline never
 * touches the numbers).
 *
 * A Client Component (not the page.tsx above it): `AnalyticsBoundary`
 * fetches client-side and takes its result-rendering as a function —
 * React Server Components cannot pass a function as a prop to a Client
 * Component, so this content has to live on the client side of that
 * boundary. `page.tsx` stays a Server Component only for its `metadata`
 * export, exactly the split `funnel`/`revenue` already used.
 */
export function OverviewPageContent() {
  return (
    <AnalyticsBoundary<OverviewResponse> path="overview">
      {({ data, leadsByInterest, social, timeseries, range }) => (
        <div className="flex flex-col gap-10">
          <OverviewComparison resolvedRange={range}>
            {(previous) => (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatTile
                  label="Visitantes"
                  value={formatInteger(data.visitors)}
                  delta={previous && <DeltaBadge current={data.visitors} previous={previous.visitors} />}
                />
                <StatTile label="Sesiones" value={formatInteger(data.sessions)} />
                <StatTile label="Duración promedio" value={formatDuration(data.avgSessionDurationSeconds)} />
                <StatTile label="Páginas / sesión" value={data.avgPagesPerSession.toFixed(1)} />
                <StatTile label="Page views" value={formatInteger(data.pageViews)} />
                <StatTile label="Landing views" value={formatInteger(data.landingViews)} />
                <StatTile label="CTA clicks" value={formatInteger(data.ctaClicks)} />
                <StatTile label="Social clicks" value={formatInteger(data.socialClicks)} />
                <StatTile label="WhatsApp clicks" value={formatInteger(data.whatsappClicks)} />
                <StatTile
                  label="Leads"
                  value={formatInteger(data.leads)}
                  delta={previous && <DeltaBadge current={data.leads} previous={previous.leads} />}
                />
                <StatTile
                  label="Compras"
                  value={formatInteger(data.purchases)}
                  delta={previous && <DeltaBadge current={data.purchases} previous={previous.purchases} />}
                />
                <StatTile
                  label="Revenue"
                  value={formatCents(data.revenueCents)}
                  delta={previous && <DeltaBadge current={data.revenueCents} previous={previous.revenueCents} />}
                />
              </div>
            )}
          </OverviewComparison>

          <div>
            <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Evolución temporal</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded border border-steel-dim/40 bg-ink-raised p-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-steel">Visitantes / día</p>
                <div className="mt-2">
                  <Sparkline points={timeseries.map((p) => ({ date: p.date, value: p.visitors }))} formatValue={formatInteger} />
                </div>
              </div>
              <div className="rounded border border-steel-dim/40 bg-ink-raised p-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-steel">Leads / día</p>
                <div className="mt-2">
                  <Sparkline points={timeseries.map((p) => ({ date: p.date, value: p.leads }))} formatValue={formatInteger} />
                </div>
              </div>
              <div className="rounded border border-steel-dim/40 bg-ink-raised p-4">
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-steel">Revenue / día</p>
                <div className="mt-2">
                  <Sparkline points={timeseries.map((p) => ({ date: p.date, value: p.revenueCents }))} formatValue={formatCents} />
                </div>
              </div>
            </div>
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
  );
}
