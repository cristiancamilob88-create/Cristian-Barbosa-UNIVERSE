import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getQrPerformance } from "@/server/analytics/qr";

/** Private. QR scans → landing views → CTA/WhatsApp clicks → leads → purchases → revenue, per registered code. */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const rows = await getQrPerformance(getPool(), resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: rows });
}
