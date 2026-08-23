import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

export interface LeadBreakdownRow {
  key: string | null;
  label: string;
  leads: number;
}

/**
 * Read models 10–13: total leads (dimension = null, single row) and
 * leads by source/campaign/interest. `lead.source_id`/`campaign_id` are
 * resolved once at creation time (docs/CRM.md) — this reads that
 * snapshot directly, no join through the mutable contact/visitor state.
 */
export async function getLeadsByDimension(
  db: Pool | PoolClient,
  dimension: "source" | "campaign" | "interest",
  range: ResolvedDateRange,
): Promise<LeadBreakdownRow[]> {
  const config = {
    source: { column: "source_id", table: "source", labelColumn: "label" },
    campaign: { column: "campaign_id", table: "campaign", labelColumn: "name" },
    interest: { column: "interest_id", table: "interest", labelColumn: "label" },
  }[dimension];

  const { rows } = await db.query<{ key: string | null; label: string | null; leads: string }>(
    `select l.${config.column} as key, dict.${config.labelColumn} as label, count(*) as leads
     from lead l
     left join ${config.table} dict on dict.id = l.${config.column}
     where l.created_at between $1 and $2
     group by l.${config.column}, dict.${config.labelColumn}
     order by leads desc`,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    key: row.key,
    label: row.label ?? (row.key === null ? "none" : row.key),
    leads: Number(row.leads),
  }));
}

export async function getTotalLeads(db: Pool | PoolClient, range: ResolvedDateRange): Promise<number> {
  const { rows } = await db.query<{ count: string }>(
    "select count(*) as count from lead where created_at between $1 and $2",
    [range.from.toISOString(), range.to.toISOString()],
  );
  return Number(rows[0].count);
}

export interface RecentLeadRow {
  id: string;
  topicRaw: string;
  status: string;
  interestLabel: string | null;
  sourceLabel: string | null;
  campaignLabel: string | null;
  qrSlug: string | null;
  medium: string | null;
  createdAt: string;
}

/**
 * The most recent leads in range, one row per lead — not an aggregate.
 * Deliberately no `contact_id`/name/email: `/api/analytics/*` is
 * documented and tested as aggregates-only, no CRM PII
 * (docs/SECURITY.md, "Analytics endpoint authorization"; see
 * `overview/route.integration.test.ts`'s no-PII assertions) — this row
 * shape keeps that invariant while still answering "¿cuántos leads
 * estamos generando, y con qué intención/fuente?" with real operational
 * detail instead of only a count. A future admin-only, non-`/api/analytics/*`
 * surface is the right place for full contact detail — see
 * docs/COMMAND_CENTER.md, "What's not built yet".
 */
export async function getRecentLeads(db: Pool | PoolClient, range: ResolvedDateRange, limit = 25): Promise<RecentLeadRow[]> {
  const { rows } = await db.query<{
    id: string;
    topic_raw: string;
    status: string;
    interest_label: string | null;
    source_label: string | null;
    campaign_label: string | null;
    qr_slug: string | null;
    medium: string | null;
    created_at: string;
  }>(
    `select l.id, l.topic_raw, l.status,
            interest.label as interest_label,
            source.label as source_label,
            campaign.name as campaign_label,
            qr_source.slug as qr_slug,
            l.medium,
            l.created_at
     from lead l
     left join interest on interest.id = l.interest_id
     left join source on source.id = l.source_id
     left join campaign on campaign.id = l.campaign_id
     left join qr_source on qr_source.id = l.qr_id
     where l.created_at between $1 and $2
     order by l.created_at desc
     limit $3`,
    [range.from.toISOString(), range.to.toISOString(), limit],
  );

  return rows.map((row) => ({
    id: row.id,
    topicRaw: row.topic_raw,
    status: row.status,
    interestLabel: row.interest_label,
    sourceLabel: row.source_label,
    campaignLabel: row.campaign_label,
    qrSlug: row.qr_slug,
    medium: row.medium,
    createdAt: row.created_at,
  }));
}
