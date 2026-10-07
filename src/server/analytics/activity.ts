import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/**
 * "Actividad de hoy" (/admin/actividad, Cristian's ask 2026-10-07): every
 * interaction in the range, grouped per visitor, in order — "who touched
 * which button, when, and where they came from". Every other section is
 * an aggregate; this is the raw timeline those aggregates are built
 * from, for a day's worth of traffic small enough to read line by line.
 *
 * Privacy (docs/SECURITY.md, "Privacy boundaries in analytics
 * endpoints"): the raw `visitor_id` never leaves this function — each
 * visitor gets a positional label ("Visitante 1", in order of arrival)
 * — and a contact is only a boolean, never a name/email/phone.
 */

/** Hard cap so a busy day can't turn this into an unbounded dump. */
export const ACTIVITY_ROW_LIMIT = 2000;

export interface ActivityStep {
  at: string;
  eventName: string;
  route: string | null;
  /** cta_click's button id (`intent_*`). */
  cta: string | null;
  /** GoLink slug (social/whatsapp/outbound clicks). */
  slug: string | null;
  /** checkout_started's offer. */
  offerSlug: string | null;
}

export interface ActivityVisitor {
  label: string;
  firstAt: string;
  lastAt: string;
  /** First attribution seen in this visitor's own events, if any. */
  source: string | null;
  campaign: string | null;
  qr: string | null;
  /** Became a contact (left their data) — a flag, never the PII itself. */
  isContact: boolean;
  steps: ActivityStep[];
}

export interface ActivityRow {
  visitor_id: string;
  contact_id: string | null;
  event_name: string;
  route: string | null;
  metadata: Record<string, unknown> | null;
  source_slug: string | null;
  campaign_slug: string | null;
  qr_slug: string | null;
  created_at: string | Date;
}

function metaString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

/**
 * Pure grouping step (unit tested): rows must arrive in ascending time
 * order. Returns visitors most-recent-activity first, labelled in
 * order of arrival so "Visitante 1" is always the day's first visitor.
 */
export function groupActivity(rows: ActivityRow[]): ActivityVisitor[] {
  const byVisitor = new Map<string, ActivityVisitor>();

  for (const row of rows) {
    const at = new Date(row.created_at).toISOString();
    let visitor = byVisitor.get(row.visitor_id);
    if (!visitor) {
      visitor = {
        label: `Visitante ${byVisitor.size + 1}`,
        firstAt: at,
        lastAt: at,
        source: null,
        campaign: null,
        qr: null,
        isContact: false,
        steps: [],
      };
      byVisitor.set(row.visitor_id, visitor);
    }

    visitor.lastAt = at;
    visitor.source ??= row.source_slug;
    visitor.campaign ??= row.campaign_slug;
    visitor.qr ??= row.qr_slug;
    if (row.contact_id) visitor.isContact = true;
    visitor.steps.push({
      at,
      eventName: row.event_name,
      route: row.route,
      cta: metaString(row.metadata, "cta"),
      slug: metaString(row.metadata, "slug"),
      offerSlug: metaString(row.metadata, "offerSlug"),
    });
  }

  return [...byVisitor.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export async function getActivityFeed(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<{ visitors: ActivityVisitor[]; truncated: boolean }> {
  const { rows } = await db.query<ActivityRow>(
    `select
       i.visitor_id, i.contact_id, i.event_name, i.route, i.metadata, i.created_at,
       s.slug as source_slug, c.slug as campaign_slug, q.slug as qr_slug
     from interaction i
     left join source s on s.id = i.source_id
     left join campaign c on c.id = i.campaign_id
     left join qr_source q on q.id = i.qr_id
     where i.created_at between $1 and $2
     order by i.created_at asc
     limit $3`,
    [range.from, range.to, ACTIVITY_ROW_LIMIT + 1],
  );

  const truncated = rows.length > ACTIVITY_ROW_LIMIT;
  return { visitors: groupActivity(truncated ? rows.slice(0, ACTIVITY_ROW_LIMIT) : rows), truncated };
}
