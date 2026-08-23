import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getSubscriptionSummary } from "@/server/analytics/commerce";

/**
 * Private. Block 05 — "Dashboard comercial": suscripciones activas/
 * pausadas/canceladas (totales actuales) + iniciadas/canceladas en el
 * rango. See getSubscriptionSummary()'s own doc comment for why there's
 * no `expired` status yet.
 */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const data = await getSubscriptionSummary(getPool(), resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data });
}
