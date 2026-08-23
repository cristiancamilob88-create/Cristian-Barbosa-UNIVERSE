import { Table } from "./Table";
import { MiniBar } from "./MiniBar";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import type { PerformanceRow } from "@/lib/adminAnalytics";

/**
 * The SOURCE|VISITORS|LEADS|PURCHASES|REVENUE|CONVERSION shape the brief
 * asks for by name — one renderer for source/campaign/medium/QR-as-
 * performance/channel-comparison, since `getPerformanceByDimension()`
 * already returns the same row shape for all four dimensions.
 * Visitors/Revenue get an inline MiniBar (relative to this table's own
 * max) so the ranking is visible without reading every number.
 */
export function PerformanceTable({ rows, labelHeader }: { rows: PerformanceRow[]; labelHeader: string }) {
  const maxVisitors = Math.max(...rows.map((r) => r.visitors), 1);
  const maxRevenue = Math.max(...rows.map((r) => r.revenueCents), 1);

  return (
    <Table<PerformanceRow>
      keyFor={(row) => row.key ?? "direct"}
      columns={[
        { header: labelHeader, render: (r) => r.label },
        {
          header: "Visitantes",
          align: "right",
          render: (r) => (
            <span className="flex items-center justify-end gap-2">
              <MiniBar value={r.visitors} max={maxVisitors} />
              <span className="tabular-nums">{formatInteger(r.visitors)}</span>
            </span>
          ),
        },
        { header: "Leads", align: "right", render: (r) => formatInteger(r.leads) },
        { header: "Compras", align: "right", render: (r) => formatInteger(r.purchases) },
        {
          header: "Revenue",
          align: "right",
          render: (r) => (
            <span className="flex items-center justify-end gap-2">
              <MiniBar value={r.revenueCents} max={maxRevenue} />
              <span className="tabular-nums">{formatCents(r.revenueCents)}</span>
            </span>
          ),
        },
        { header: "Visitor→Lead", align: "right", render: (r) => formatRatio(r.visitorToLeadRate) },
        { header: "Lead→Purchase", align: "right", render: (r) => formatRatio(r.leadToPurchaseRate) },
      ]}
      rows={rows}
    />
  );
}
