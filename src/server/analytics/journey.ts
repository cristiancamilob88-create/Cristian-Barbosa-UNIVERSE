import "server-only";
import type { Pool, PoolClient } from "pg";

export interface JourneyStep {
  eventName: string;
  route: string | null;
  sourceSlug: string | null;
  campaignSlug: string | null;
  qrSlug: string | null;
  medium: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * Reconstructs a contact's full journey in order, with the attribution
 * that applied *at the moment each event fired* (not the contact's
 * current, possibly-since-changed state) — this is the query
 * docs/AUDIENCE_JOURNEY.md's worked example describes. Every dictionary
 * join is a slug, never raw PII — see docs/SECURITY.md, "Privacy
 * boundaries in analytics endpoints".
 */
export async function getContactJourney(db: Pool | PoolClient, contactId: string): Promise<JourneyStep[]> {
  const { rows } = await db.query<{
    event_name: string;
    route: string | null;
    source_slug: string | null;
    campaign_slug: string | null;
    qr_slug: string | null;
    medium: string | null;
    content: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>(
    `select
       i.event_name, i.route,
       s.slug as source_slug, c.slug as campaign_slug, q.slug as qr_slug,
       i.medium, i.content, i.metadata, i.created_at
     from interaction i
     left join source s on s.id = i.source_id
     left join campaign c on c.id = i.campaign_id
     left join qr_source q on q.id = i.qr_id
     where i.contact_id = $1
     order by i.created_at asc`,
    [contactId],
  );

  return rows.map((row) => ({
    eventName: row.event_name,
    route: row.route,
    sourceSlug: row.source_slug,
    campaignSlug: row.campaign_slug,
    qrSlug: row.qr_slug,
    medium: row.medium,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

/** Same reconstruction keyed by visitor — for a not-yet-identified journey. */
export async function getVisitorJourney(db: Pool | PoolClient, visitorId: string): Promise<JourneyStep[]> {
  const { rows } = await db.query<{
    event_name: string;
    route: string | null;
    source_slug: string | null;
    campaign_slug: string | null;
    qr_slug: string | null;
    medium: string | null;
    content: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>(
    `select
       i.event_name, i.route,
       s.slug as source_slug, c.slug as campaign_slug, q.slug as qr_slug,
       i.medium, i.content, i.metadata, i.created_at
     from interaction i
     left join source s on s.id = i.source_id
     left join campaign c on c.id = i.campaign_id
     left join qr_source q on q.id = i.qr_id
     where i.visitor_id = $1
     order by i.created_at asc`,
    [visitorId],
  );

  return rows.map((row) => ({
    eventName: row.event_name,
    route: row.route,
    sourceSlug: row.source_slug,
    campaignSlug: row.campaign_slug,
    qrSlug: row.qr_slug,
    medium: row.medium,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}
