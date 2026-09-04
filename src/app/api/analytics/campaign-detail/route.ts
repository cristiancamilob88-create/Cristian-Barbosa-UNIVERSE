import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getCampaignDetail } from "@/server/analytics/campaignDetail";

/** Private. CAMPAIGN → VISITS → LANDING VIEWS → CTA CLICKS → WHATSAPP CLICKS → LEADS → PURCHASES → REVENUE, per registered campaign. Powers /admin/campanas (list) and /admin/campanas/[slug] (detail — picks its one row out of this same response). */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const rows = await getCampaignDetail(getPool(), resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: rows });
}
