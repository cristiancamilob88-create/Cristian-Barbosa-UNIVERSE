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
