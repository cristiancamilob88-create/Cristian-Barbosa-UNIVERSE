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
  /** Where the requested event is, when the shows form captured it (migration 0016). */
  eventAddress: {
    line: string;
    detail: string | null;
    city: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
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
    event_address_line: string | null;
    event_address_detail: string | null;
    event_city: string | null;
    event_region: string | null;
    event_latitude: number | null;
    event_longitude: number | null;
    created_at: string;
  }>(
    `select o.id, o.category, o.stage, o.estimated_value_cents, o.notes,
            c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
            source.label as source_label, campaign.name as campaign_label,
            ev.event_address_line, ev.event_address_detail, ev.event_city, ev.event_region,
            ev.event_latitude, ev.event_longitude,
            o.created_at
     from b2b_opportunity o
     join contact c on c.id = o.contact_id
     left join source on source.id = o.source_id
     left join campaign on campaign.id = o.campaign_id
     -- The event location lives on the lead written in the same
     -- /api/lead request as this opportunity (migration 0016).
     left join lateral (
       select l.event_address_line, l.event_address_detail, l.event_city, l.event_region,
              l.event_latitude, l.event_longitude
       from lead l
       where l.contact_id = o.contact_id
         and l.event_address_line is not null
         and l.created_at between o.created_at - interval '1 minute' and o.created_at + interval '1 minute'
       order by l.created_at desc
       limit 1
     ) ev on true
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
    eventAddress: row.event_address_line
      ? {
          line: row.event_address_line,
          detail: row.event_address_detail,
          city: row.event_city,
          region: row.event_region,
          latitude: row.event_latitude === null ? null : Number(row.event_latitude),
          longitude: row.event_longitude === null ? null : Number(row.event_longitude),
        }
      : null,
    createdAt: row.created_at,
  }));
}
