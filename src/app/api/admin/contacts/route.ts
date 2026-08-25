import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/server/db/pool";
import { requireAdminApiSession } from "@/server/admin/auth";
import { getRecentContactLeads } from "@/server/admin/contacts";

/**
 * Private, PII-bearing (name/email/phone) — deliberately NOT under
 * `/api/analytics/*`, see `src/server/admin/contacts.ts`'s own doc
 * comment. Session-cookie-only auth (`requireAdminApiSession`), no
 * bearer-token path.
 */
export async function GET(request: NextRequest) {
  const denied = requireAdminApiSession(request);
  if (denied) return denied;

  const rows = await getRecentContactLeads(getPool());
  return NextResponse.json({ ok: true, data: rows });
}
