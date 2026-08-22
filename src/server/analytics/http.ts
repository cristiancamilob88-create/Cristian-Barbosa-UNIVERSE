import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { parseDateRangeParams, type ResolvedDateRange } from "./dateRange";
import { requireAnalyticsAuth } from "./auth";

/**
 * Shared entry point for every /api/analytics/* route: auth gate, then
 * date-range parsing, both as a single early-return check. Keeps each
 * route file down to "resolve range, call the query function(s), return
 * JSON" — no duplicated boilerplate across eight files.
 */
export function resolveAnalyticsRequest(
  request: NextRequest,
): { range: ResolvedDateRange } | { error: NextResponse } {
  const authError = requireAnalyticsAuth(request);
  if (authError) return { error: authError };

  try {
    return { range: parseDateRangeParams(request.nextUrl.searchParams) };
  } catch (err) {
    return {
      error: NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "Invalid date range." },
        { status: 400 },
      ),
    };
  }
}
