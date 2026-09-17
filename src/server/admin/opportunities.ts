import "server-only";
import type { Pool, PoolClient } from "pg";

export interface B2bOpportunityDetail {
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

/**
 * Real contact detail (name/email/phone) for the shows/brands/sponsors
 * pipeline — same reasoning as `getRecentContactLeads()`
 * (`src/server/admin/contacts.ts`), same separation: `b2b_opportunity`
 * has had a real writer since Block 07 (`/contacto?topic=shows|marcas`
 * → `/api/lead` → `createB2bOpportunity()`), but nowhere in `/admin` to
 * see it — Cristian's own ask, 2026-09-13 ("Ruta de Capitalización"):
 * a real booking/brand-deal inquiry was invisible unless he asked for a
 * direct SQL query. Deliberately NOT `src/server/analytics/`/
 * `/api/analytics/*` (PII, same invariant `getRecentLeads()`'s own doc
 * comment names) — this is that admin-only surface, parallel to
 * `contacts.ts`.
 *
 * One row per opportunity, most-recent-first, no date range (same as
 * `getRecentContactLeads()` — this page's job is "who do I need to
 * follow up with and where are they in the pipeline", not a trend; an
 * open negotiation from 6 weeks ago shouldn't fall off a date-windowed
 * view).
 */
export async function getRecentB2bOpportunities(db: Pool | PoolClient, limit = 100): Promise<B2bOpportunityDetail[]> {
  const { rows } = await db.query<{
    id: string;
    category: string;
    stage: string;
    estimated_value_cents: number | null;
    notes: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    source_label: string | null;
    campaign_label: string | null;
    created_at: string;
  }>(
    `select o.id, o.category, o.stage, o.estimated_value_cents, o.notes,
            c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
            source.label as source_label, campaign.name as campaign_label,
            o.created_at
     from b2b_opportunity o
     join contact c on c.id = o.contact_id
     left join source on source.id = o.source_id
     left join campaign on campaign.id = o.campaign_id
     order by o.created_at desc
     limit $1`,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    stage: row.stage,
    estimatedValueCents: row.estimated_value_cents === null ? null : Number(row.estimated_value_cents),
    notes: row.notes,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    sourceLabel: row.source_label,
    campaignLabel: row.campaign_label,
    createdAt: row.created_at,
  }));
}
