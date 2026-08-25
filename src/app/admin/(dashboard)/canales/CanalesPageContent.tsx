"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { PerformanceTable } from "@/components/admin/PerformanceTable";
import type { PerformanceResponse } from "@/lib/adminAnalytics";

/** Client Component split from page.tsx — see OverviewPageContent.tsx's doc comment for why. */
export function CanalesPageContent() {
  return (
    <AnalyticsBoundary<PerformanceResponse> path="sources" isEmpty={(r) => r.data.length === 0}>
      {(res) => <PerformanceTable rows={res.data} labelHeader="Canal" />}
    </AnalyticsBoundary>
  );
}
