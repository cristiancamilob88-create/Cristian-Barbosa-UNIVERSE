import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getRecentB2bOpportunities } from "@/server/admin/opportunities";

/**
 * Private, PII-bearing (name/email/phone) — deliberately NOT under
 * `/api/analytics/*`, see `src/server/admin/opportunities.ts`'s own doc
 * comment. Session-cookie-only auth (`requireAdminApiSession`), no
 * bearer-token path — same posture as `/api/admin/contacts`.
 */
export async function GET(request: NextRequest) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const rows = await getRecentB2bOpportunities(getPool());
  return NextResponse.json({ ok: true, data: rows });
}
