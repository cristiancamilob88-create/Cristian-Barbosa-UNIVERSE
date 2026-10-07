import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { resolveAnalyticsRequest } from "@/server/analytics/http";
import { getActivityFeed } from "@/server/analytics/activity";

/** Private. Per-visitor event timeline for the range — see getActivityFeed()'s doc comment. */
export async function GET(request: NextRequest) {
  const resolved = resolveAnalyticsRequest(request);
  if ("error" in resolved) return resolved.error;

  const feed = await getActivityFeed(getPool(), resolved.range);
  return NextResponse.json({ ok: true, range: resolved.range, data: feed.visitors, truncated: feed.truncated });
}
