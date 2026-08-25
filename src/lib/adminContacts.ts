/**
 * Client-side contract for `/api/admin/contacts` — kept separate from
 * `src/lib/adminAnalytics.ts` on purpose: that file is documented as
 * the `/api/analytics/*` DTO boundary specifically (aggregates only,
 * no PII). This is the one place in the whole app that types a row
 * with a real name/email/phone in it.
 */

export interface ContactLeadRow {
  leadId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  topicRaw: string;
  message: string | null;
  status: string;
  interestLabel: string | null;
  sourceLabel: string | null;
  campaignLabel: string | null;
  qrSlug: string | null;
  createdAt: string;
}

export interface ContactsResponse {
  ok: true;
  data: ContactLeadRow[];
}

export class AdminContactsApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminContactsApiError";
    this.status = status;
  }
}

/** `credentials: "same-origin"` (the default) sends the httpOnly admin session cookie automatically — same posture as fetchAnalytics(). */
export async function fetchContacts(): Promise<ContactsResponse> {
  const res = await fetch("/api/admin/contacts", { cache: "no-store" });

  let body: { ok?: boolean; error?: string } & Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    // fall through — !res.ok below still produces a useful error
  }

  if (!res.ok || body.ok !== true) {
    throw new AdminContactsApiError(res.status, body.error ?? `La solicitud falló (${res.status}).`);
  }
  return body as unknown as ContactsResponse;
}
