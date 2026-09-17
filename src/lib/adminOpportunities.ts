/**
 * Client-side contract for `/api/admin/opportunities` — kept separate
 * from `src/lib/adminAnalytics.ts` on purpose, same reasoning as
 * `src/lib/adminContacts.ts`: that file is the `/api/analytics/*` DTO
 * boundary specifically (aggregates only, no PII). This one types a
 * row with a real name/email/phone in it.
 */

export interface B2bOpportunityRow {
  id: string;
  category: string;
  stage: string;
  estimatedValueCents: number | null;
  notes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  sourceLabel: string | null;
  campaignLabel: string | null;
  createdAt: string;
}

export interface OpportunitiesResponse {
  ok: true;
  data: B2bOpportunityRow[];
}

export class AdminOpportunitiesApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminOpportunitiesApiError";
    this.status = status;
  }
}

/** `credentials: "same-origin"` (the default) sends the httpOnly admin session cookie automatically — same posture as fetchContacts(). */
export async function fetchOpportunities(): Promise<OpportunitiesResponse> {
  const res = await fetch("/api/admin/opportunities", { cache: "no-store" });

  let body: { ok?: boolean; error?: string } & Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    // fall through — !res.ok below still produces a useful error
  }

  if (!res.ok || body.ok !== true) {
    throw new AdminOpportunitiesApiError(res.status, body.error ?? `La solicitud falló (${res.status}).`);
  }
  return body as unknown as OpportunitiesResponse;
}
