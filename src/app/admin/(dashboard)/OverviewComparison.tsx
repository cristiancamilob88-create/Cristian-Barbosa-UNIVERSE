"use client";

import type { ReactNode } from "react";
import { useAnalyticsQueryForRange } from "@/components/admin/useAnalyticsQuery";
import { previousRangeOf, type OverviewResponse, type AnalyticsOverview, type ResolvedRange } from "@/lib/adminAnalytics";

/**
 * "Comparaciones temporales cuando los datos lo permitan" (Block 04.1).
 * A second fetch of the exact same GET /api/analytics/overview endpoint
 * — no new route, no backend change — for the immediately-preceding,
 * equal-length window (previousRangeOf(), src/lib/adminAnalytics.ts).
 * Render-prop: the page decides where each delta lands (next to its own
 * StatTile), this component only owns the fetch.
 */
export function OverviewComparison({
  resolvedRange,
  children,
}: {
  resolvedRange: ResolvedRange;
  children: (previous: AnalyticsOverview | null) => ReactNode;
}) {
  const state = useAnalyticsQueryForRange<OverviewResponse>("overview", previousRangeOf(resolvedRange));
  return <>{children(state.status === "ready" ? state.data.data : null)}</>;
}
