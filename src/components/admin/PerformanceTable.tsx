import { Table } from "./Table";
import { formatInteger, formatCents, formatRatio } from "@/lib/format";
import type { PerformanceRow } from "@/lib/adminAnalytics";

/**
 * The SOURCE|VISITORS|LEADS|PURCHASES|REVENUE|CONVERSION shape the brief
 * asks for by name — one renderer for source/campaign/QR-as-performance/
 * channel-comparison, since `getPerformanceByDimension()` already
 * returns the same row shape for all three dimensions.
 */
export function PerformanceTable({ rows, labelHeader }: { rows: PerformanceRow[]; labelHeader: string }) {
  return (
    <Table<PerformanceRow>
      keyFor={(row) => row.key ?? "direct"}
      columns={[
        { header: labelHeader, render: (r) => r.label },
        { header: "Visitantes", align: "right", render: (r) => formatInteger(r.visitors) },
        { header: "Leads", align: "right", render: (r) => formatInteger(r.leads) },
        { header: "Compras", align: "right", render: (r) => formatInteger(r.purchases) },
        { header: "Revenue", align: "right", render: (r) => formatCents(r.revenueCents) },
        { header: "Visitor→Lead", align: "right", render: (r) => formatRatio(r.visitorToLeadRate) },
        { header: "Lead→Purchase", align: "right", render: (r) => formatRatio(r.leadToPurchaseRate) },
      ]}
      rows={rows}
    />
  );
}
