"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger } from "@/lib/format";
import type { CtasResponse, CtaRow } from "@/lib/adminAnalytics";

/** Client Component split from page.tsx — see OverviewPageContent.tsx's doc comment for why. */
export function CtasPageContent() {
  return (
    <AnalyticsBoundary<CtasResponse> path="ctas" isEmpty={(r) => r.data.length === 0}>
      {(res) => (
        <Table<CtaRow>
          keyFor={(row) => `${row.cta}|${row.route ?? ""}`}
          columns={[
            { header: "CTA", render: (r) => r.cta },
            { header: "Página", render: (r) => r.route ?? "—" },
            { header: "Tema", render: (r) => r.topic ?? "—" },
            { header: "Clics", align: "right", render: (r) => formatInteger(r.clicks) },
            { header: "Visitantes únicos", align: "right", render: (r) => formatInteger(r.uniqueVisitors) },
          ]}
          rows={res.data}
        />
      )}
    </AnalyticsBoundary>
  );
}
