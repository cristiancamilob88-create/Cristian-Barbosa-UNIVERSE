"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger } from "@/lib/format";
import type { OverviewResponse } from "@/lib/adminAnalytics";

/** Client Component split from page.tsx — see OverviewPageContent.tsx's doc comment for why. */
export function SocialPageContent() {
  return (
    <AnalyticsBoundary<OverviewResponse> path="overview" isEmpty={(r) => r.social.length === 0}>
      {({ social }) => (
        <Table
          keyFor={(row) => `${row.platform}-${row.slug}`}
          columns={[
            { header: "Plataforma", render: (r) => r.platform },
            { header: "Slug (/go/...)", render: (r) => r.slug },
            { header: "Clics", align: "right", render: (r) => formatInteger(r.clicks) },
            { header: "Visitantes únicos", align: "right", render: (r) => formatInteger(r.uniqueVisitors) },
          ]}
          rows={social}
        />
      )}
    </AnalyticsBoundary>
  );
}
