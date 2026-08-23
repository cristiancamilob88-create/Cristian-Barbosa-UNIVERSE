import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getPerformanceByDimension } from "@/server/analytics/performance";

/** Private. MEDIUM → VISITORS → LEADS → PURCHASES → REVENUE → CONVERSION (Block 04.1). */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const rows = await getPerformanceByDimension(getPool(), "medium", resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: rows });
}
