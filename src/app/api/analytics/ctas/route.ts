import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getCtaPerformance } from "@/server/analytics/engagement";

/** Private. CTA-click breakdown by (cta id, route) — see getCtaPerformance()'s doc comment. */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const rows = await getCtaPerformance(getPool(), resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: rows });
}
