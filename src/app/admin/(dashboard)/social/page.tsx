import type { Metadata } from "next";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { Table } from "@/components/admin/Table";
import { formatInteger } from "@/lib/format";
import type { OverviewResponse } from "@/lib/adminAnalytics";

export const metadata: Metadata = { title: "Social routing" };

/**
 * Section 3 — Social routing (FASE 4). Reuses GET /api/analytics/overview
 * (its `social` field, from getSocialPerformance()) rather than adding a
 * dedicated /api/analytics/social route — the brief names 8 endpoints,
 * not 9, and this data already has a home (docs/COMMAND_CENTER.md,
 * "Endpoints used, and why not more"). Measures only Universe → click →
 * redirect → destination — never what happens inside Instagram/Facebook/
 * TikTok themselves (docs/SOCIAL_ROUTING.md).
 */
export default function AdminSocialPage() {
  return (
    <>
      <SectionHeader
        tag="Social routing"
        title="/go/[slug] performance"
        description="Clicks salientes desde el Universe hacia cada destino externo — no medimos qué pasa dentro de Instagram/Facebook/TikTok."
      />
      <AnalyticsBoundary<OverviewResponse> path="overview" isEmpty={(r) => r.social.length === 0}>
        {({ social }) => (
          <Table
            keyFor={(row) => `${row.platform}-${row.slug}`}
            columns={[
              { header: "Plataforma", render: (r) => r.platform },
              { header: "Slug (/go/...)", render: (r) => r.slug },
              { header: "Clicks", align: "right", render: (r) => formatInteger(r.clicks) },
              { header: "Visitantes únicos", align: "right", render: (r) => formatInteger(r.uniqueVisitors) },
            ]}
            rows={social}
          />
        )}
      </AnalyticsBoundary>
    </>
  );
}
