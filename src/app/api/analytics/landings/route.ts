import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getLandingPerformance } from "@/server/analytics/engagement";

/** Private. Per-route views/unique visitors/CTA clicks/lead+purchase conversion. */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const rows = await getLandingPerformance(getPool(), resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: rows });
}
