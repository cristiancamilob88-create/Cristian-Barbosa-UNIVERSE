import "server-only";
import type { Pool, PoolClient } from "pg";

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

/**
 * Real contact detail (name/email/phone) — deliberately NOT under
 * `src/server/analytics/` or `/api/analytics/*`: that whole family is
 * documented and tested as aggregates-only, no PII (docs/SECURITY.md;
 * `overview/route.integration.test.ts`'s no-PII assertions;
 * `getRecentLeads()`'s own doc comment, which named this exact gap —
 * "A future admin-only, non-`/api/analytics/*` surface is the right
 * place for full contact detail"). This is that surface: a new
 * `src/server/admin/` module, parallel to `analytics/`/`auth/`/
 * `commerce/`, gated by the admin session cookie only (see
 * `src/app/api/admin/contacts/route.ts` — no bearer-token fallback,
 * unlike `requireAnalyticsAuth()`, since PII shouldn't be reachable by
 * a shared API token meant for a future automation caller).
 *
 * One row per lead (not deduped by contact) — the same person can
 * register more than once with a different topic, and each submission
 * is its own real event Cristian would want to see and act on. No date
 * range yet (unlike every `/api/analytics/*` read model): this page's
 * job is "who do I need to follow up with", not a trend — most-recent-
 * first with a cap is what that needs, added 2026-08-25 at Cristian's
 * own request ("quiero ver esa base de datos de esas personas").
 */
export async function getRecentContactLeads(db: Pool | PoolClient, limit = 100): Promise<ContactLeadRow[]> {
  const { rows } = await db.query<{
    lead_id: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    topic_raw: string;
    message: string | null;
    status: string;
    interest_label: string | null;
    source_label: string | null;
    campaign_label: string | null;
    qr_slug: string | null;
    created_at: string;
  }>(
    `select l.id as lead_id,
            c.name as contact_name,
            c.email as contact_email,
            c.phone as contact_phone,
            l.topic_raw,
            l.message,
            l.status,
            interest.label as interest_label,
            source.label as source_label,
            campaign.name as campaign_label,
            qr_source.slug as qr_slug,
            l.created_at
     from lead l
     join contact c on c.id = l.contact_id
     left join interest on interest.id = l.interest_id
     left join source on source.id = l.source_id
     left join campaign on campaign.id = l.campaign_id
     left join qr_source on qr_source.id = l.qr_id
     order by l.created_at desc
     limit $1`,
    [limit],
  );

  return rows.map((row) => ({
    leadId: row.lead_id,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    topicRaw: row.topic_raw,
    message: row.message,
    status: row.status,
    interestLabel: row.interest_label,
    sourceLabel: row.source_label,
    campaignLabel: row.campaign_label,
    qrSlug: row.qr_slug,
    createdAt: row.created_at,
  }));
}
