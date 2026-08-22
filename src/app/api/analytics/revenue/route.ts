import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import {
  getTotalRevenue,
  getRevenueByDimension,
  getRevenueByProductAndOffer,
  type AttributionMode,
} from "@/server/analytics/revenue";

/**
 * Private. `?attribution=first_touch` (default) or `last_touch` — see
 * docs/ANALYTICS_ENGINE.md, "Revenue attribution", for why only these
 * two exist (no multi-touch model in this block).
 */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const attributionParam = request.nextUrl.searchParams.get("attribution") ?? "first_touch";
  if (attributionParam !== "first_touch" && attributionParam !== "last_touch") {
    return NextResponse.json(
      { ok: false, error: 'attribution must be "first_touch" or "last_touch".' },
      { status: 400 },
    );
  }
  const attribution: AttributionMode = attributionParam;

  const pool = getPool();
  const [total, bySource, byCampaign, byQr, byProductAndOffer] = await Promise.all([
    getTotalRevenue(pool, resolved.range),
    getRevenueByDimension(pool, "source", attribution, resolved.range),
    getRevenueByDimension(pool, "campaign", attribution, resolved.range),
    getRevenueByDimension(pool, "qr", attribution, resolved.range),
    getRevenueByProductAndOffer(pool, resolved.range),
  ]);

  return NextResponse.json({
    ok: true,
    range: resolved.range,
    attribution,
    data: { total, bySource, byCampaign, byQr, byProductAndOffer },
  });
}
