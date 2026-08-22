import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getProductViews } from "@/server/analytics/products";
import { getRevenueByProductAndOffer } from "@/server/analytics/revenue";

/** Private. Product/offer views (once a catalog page fires them — Block 04) plus revenue by product/offer. */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const [views, revenue] = await Promise.all([
    getProductViews(getPool(), resolved.range),
    getRevenueByProductAndOffer(getPool(), resolved.range),
  ]);

  return NextResponse.json({ ok: true, range: resolved.range, data: { views, revenue } });
}
