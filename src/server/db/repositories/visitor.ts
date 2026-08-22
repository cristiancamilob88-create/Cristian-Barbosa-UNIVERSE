import "server-only";
import type { PoolClient } from "pg";
import type { ResolvedTouch } from "./reference";

/**
 * Ensures a `visitor` row exists for this anonymous id and bumps
 * last_seen_at. Safe to call from any route that needs a visitor to
 * exist (e.g. before inserting an interaction) without also having new
 * attribution to record.
 */
export async function ensureVisitor(client: PoolClient, visitorId: string): Promise<void> {
  await client.query(
    `insert into visitor (id) values ($1)
     on conflict (id) do update set last_seen_at = now()`,
    [visitorId],
  );
}

/**
 * Records a touch against a visitor: last-touch always updates,
 * first-touch is written once and never again (enforced here by only
 * setting it `where first_touch_captured_at is null`, and backstopped at
 * the DB level for `contact` by the immutability trigger in
 * 0001_init_schema.sql — visitor rows are pre-identification, so a
 * trigger there is unnecessary, this WHERE clause is sufficient).
 */
export async function recordVisitorTouch(
  client: PoolClient,
  visitorId: string,
  touch: ResolvedTouch,
): Promise<void> {
  if (touch.capturedAt === null) {
    await ensureVisitor(client, visitorId);
    return;
  }

  await client.query(
    `insert into visitor (
       id, last_seen_at,
       last_touch_source_id, last_touch_campaign_id, last_touch_qr_id,
       last_touch_medium, last_touch_content, last_touch_term,
       last_touch_referrer, last_touch_landing_path, last_touch_captured_at,
       first_touch_source_id, first_touch_campaign_id, first_touch_qr_id,
       first_touch_medium, first_touch_content, first_touch_term,
       first_touch_referrer, first_touch_landing_path, first_touch_captured_at
     )
     values (
       $1, now(),
       $2, $3, $4, $5, $6, $7, $8, $9, $10,
       $2, $3, $4, $5, $6, $7, $8, $9, $10
     )
     on conflict (id) do update set
       last_seen_at = now(),
       last_touch_source_id = excluded.last_touch_source_id,
       last_touch_campaign_id = excluded.last_touch_campaign_id,
       last_touch_qr_id = excluded.last_touch_qr_id,
       last_touch_medium = excluded.last_touch_medium,
       last_touch_content = excluded.last_touch_content,
       last_touch_term = excluded.last_touch_term,
       last_touch_referrer = excluded.last_touch_referrer,
       last_touch_landing_path = excluded.last_touch_landing_path,
       last_touch_captured_at = excluded.last_touch_captured_at,
       first_touch_source_id = coalesce(visitor.first_touch_source_id, excluded.first_touch_source_id),
       first_touch_campaign_id = coalesce(visitor.first_touch_campaign_id, excluded.first_touch_campaign_id),
       first_touch_qr_id = coalesce(visitor.first_touch_qr_id, excluded.first_touch_qr_id),
       first_touch_medium = coalesce(visitor.first_touch_medium, excluded.first_touch_medium),
       first_touch_content = coalesce(visitor.first_touch_content, excluded.first_touch_content),
       first_touch_term = coalesce(visitor.first_touch_term, excluded.first_touch_term),
       first_touch_referrer = coalesce(visitor.first_touch_referrer, excluded.first_touch_referrer),
       first_touch_landing_path = coalesce(visitor.first_touch_landing_path, excluded.first_touch_landing_path),
       first_touch_captured_at = coalesce(visitor.first_touch_captured_at, excluded.first_touch_captured_at)`,
    [
      visitorId,
      touch.sourceId,
      touch.campaignId,
      touch.qrId,
      touch.medium,
      touch.content,
      touch.term,
      touch.referrer,
      touch.landingPath,
      touch.capturedAt,
    ],
  );
}

export interface VisitorRow {
  id: string;
  first_touch_source_id: string | null;
  first_touch_campaign_id: string | null;
  first_touch_qr_id: string | null;
  first_touch_medium: string | null;
  first_touch_content: string | null;
  first_touch_term: string | null;
  first_touch_referrer: string | null;
  first_touch_landing_path: string | null;
  first_touch_captured_at: string | null;
  last_touch_source_id: string | null;
  last_touch_campaign_id: string | null;
  last_touch_qr_id: string | null;
  last_touch_medium: string | null;
  last_touch_content: string | null;
  last_touch_term: string | null;
  last_touch_referrer: string | null;
  last_touch_landing_path: string | null;
  last_touch_captured_at: string | null;
}

export async function getVisitor(client: PoolClient, visitorId: string): Promise<VisitorRow | null> {
  const result = await client.query<VisitorRow>("select * from visitor where id = $1", [visitorId]);
  return result.rows[0] ?? null;
}

/**
 * Links a visitor to the contact it turned out to be, and backfills any
 * of that visitor's prior interaction rows that didn't have a contact
 * yet — without rewriting what those events *were*, only who they belong
 * to. See docs/AUDIENCE_JOURNEY.md.
 */
export async function linkVisitorToContact(
  client: PoolClient,
  visitorId: string,
  contactId: string,
): Promise<void> {
  await client.query(
    `insert into contact_visitor (visitor_id, contact_id)
     values ($1, $2)
     on conflict (visitor_id) do update set contact_id = excluded.contact_id, linked_at = now()`,
    [visitorId, contactId],
  );

  await client.query(
    `update interaction set contact_id = $2
     where visitor_id = $1 and contact_id is null`,
    [visitorId, contactId],
  );
}

export async function findContactIdForVisitor(
  client: PoolClient,
  visitorId: string,
): Promise<string | null> {
  const result = await client.query<{ contact_id: string }>(
    "select contact_id from contact_visitor where visitor_id = $1",
    [visitorId],
  );
  return result.rows[0]?.contact_id ?? null;
}
