"use client";

import { useState } from "react";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { AttributionControl } from "@/components/admin/AttributionControl";
import { Table } from "@/components/admin/Table";
import { StatTile } from "@/components/admin/StatTile";
import { formatInteger, formatCents } from "@/lib/format";
import type { RevenueResponse, RevenueBreakdownRow, ProductRevenueRow, AttributionMode } from "@/lib/adminAnalytics";

function BreakdownTable({ rows, labelHeader }: { rows: RevenueBreakdownRow[]; labelHeader: string }) {
  if (rows.length === 0) return <p className="text-sm text-steel">Sin ventas registradas todavía.</p>;
  return (
    <Table<RevenueBreakdownRow>
      keyFor={(row) => row.key ?? "direct"}
      columns={[
        { header: labelHeader, render: (r) => r.label },
        { header: "Compras", align: "right", render: (r) => formatInteger(r.purchases) },
        { header: "Revenue", align: "right", render: (r) => formatCents(r.revenueCents) },
      ]}
      rows={rows}
    />
  );
}

export function RevenuePageContent() {
  const [attribution, setAttribution] = useState<AttributionMode>("first_touch");

  return (
    <div className="flex flex-col gap-10">
      <AttributionControl value={attribution} onChange={setAttribution} />
      <AnalyticsBoundary<RevenueResponse> path="revenue" extra={{ attribution }}>
        {({ data }) => (
          <div className="flex flex-col gap-10">
            <StatTile label="Revenue total" value={formatCents(data.total.revenueCents)} sub={`${formatInteger(data.total.purchases)} compras`} />

            {data.total.purchases === 0 ? (
              <p className="rounded border border-dashed border-steel-dim/50 px-6 py-10 text-center text-sm text-steel">
                Sin ventas registradas todavía.
              </p>
            ) : (
              <>
                <div>
                  <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por fuente</h2>
                  <BreakdownTable rows={data.bySource} labelHeader="Fuente" />
                </div>
                <div>
                  <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por campaña</h2>
                  <BreakdownTable rows={data.byCampaign} labelHeader="Campaña" />
                </div>
                <div>
                  <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por QR</h2>
                  <BreakdownTable rows={data.byQr} labelHeader="QR" />
                </div>
                <div>
                  <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por producto/oferta</h2>
                  <Table<ProductRevenueRow>
                    keyFor={(row) => `${row.productSlug}-${row.offerSlug}`}
                    columns={[
                      { header: "Producto", render: (r) => r.productName },
                      { header: "Oferta", render: (r) => r.offerSlug },
                      { header: "Compras", align: "right", render: (r) => formatInteger(r.purchases) },
                      { header: "Revenue", align: "right", render: (r) => formatCents(r.revenueCents) },
                    ]}
                    rows={data.byProductAndOffer}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </AnalyticsBoundary>
    </div>
  );
}
