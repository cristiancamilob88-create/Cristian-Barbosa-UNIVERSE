"use client";

import { AnalyticsBoundary } from "@/components/admin/AnalyticsBoundary";
import { PerformanceTable } from "@/components/admin/PerformanceTable";
import type { PerformanceResponse } from "@/lib/adminAnalytics";

/** Client Component split from page.tsx — see OverviewPageContent.tsx's doc comment for why. */
export function FuentesPageContent() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por fuente (source)</h2>
        <AnalyticsBoundary<PerformanceResponse> path="sources" isEmpty={(r) => r.data.length === 0}>
          {(res) => <PerformanceTable rows={res.data} labelHeader="Fuente" />}
        </AnalyticsBoundary>
      </div>
      <div>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por campaña</h2>
        <AnalyticsBoundary<PerformanceResponse> path="campaigns" isEmpty={(r) => r.data.length === 0}>
          {(res) => <PerformanceTable rows={res.data} labelHeader="Campaña" />}
        </AnalyticsBoundary>
      </div>
      <div>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-steel">Por medium</h2>
        <AnalyticsBoundary<PerformanceResponse> path="medium" isEmpty={(r) => r.data.length === 0}>
          {(res) => <PerformanceTable rows={res.data} labelHeader="Medium" />}
        </AnalyticsBoundary>
      </div>
    </div>
  );
}
