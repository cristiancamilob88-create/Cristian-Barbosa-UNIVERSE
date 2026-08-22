import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getAnalyticsOverview } from "@/server/analytics/overview";
import { getLeadsByDimension } from "@/server/analytics/leads";
import { getSocialPerformance } from "@/server/analytics/social";

/**
 * Private (requireAnalyticsAuth — docs/SECURITY.md). Aggregates only —
 * see docs/ANALYTICS_ENGINE.md, "Privacy in analytics endpoints".
 *
 * Bundles two read models that don't have their own endpoint (there's
 * no natural "interest" or "social" top-level route among the eight the
 * brief names) alongside the core KPI object: leads by interest, and
 * social/outbound click performance.
 */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const pool = getPool();
  const [overview, leadsByInterest, social] = await Promise.all([
    getAnalyticsOverview(pool, resolved.range),
    getLeadsByDimension(pool, "interest", resolved.range),
    getSocialPerformance(pool, resolved.range),
  ]);

  return NextResponse.json({ ok: true, range: resolved.range, data: overview, leadsByInterest, social });
}
