import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getRecentLeads } from "@/server/analytics/leads";

/**
 * Private. The individual-lead list behind the Command Center's Leads
 * section (Block 04.1) — leads-by-interest/source/campaign aggregates
 * already live in `overview`/`sources`/`campaigns`; this is the one new
 * thing: a real recent-activity list. No PII (no name/email) — see
 * `getRecentLeads()`'s own doc comment.
 */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const rows = await getRecentLeads(getPool(), resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: rows });
}
