import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/**
 * One row of a "performance table" — SOURCE | VISITORS | LEADS |
 * PURCHASES | REVENUE | CONVERSION, or the same shape keyed by campaign
 * or QR (docs/ANALYTICS_ENGINE.md, "Source/Campaign/QR performance").
 * `key` is null for the "no attribution" bucket (direct traffic, a lead
 * with no campaign, ...).
 */
export interface PerformanceRow {
  key: string | null;
  label: string;
  visitors: number;
  leads: number;
  purchases: number;
  revenueCents: number;
  visitorToLeadRate: number | null;
  leadToPurchaseRate: number | null;
}

export type PerformanceDimension = "source" | "campaign" | "qr" | "medium";

/**
 * One function serves source/campaign/QR/medium performance instead of
 * near-duplicate queries — only which column each table groups by (and,
 * for source/campaign/qr, which dictionary table resolves the label)
 * changes between them, chosen from this fixed, hardcoded map (never
 * from unvalidated input, so there's no SQL-injection surface in
 * branching on `dimension`).
 *
 * `medium` has `dictionaryTable: null` — unlike source/campaign/qr it's
 * free text everywhere in this schema (visitor/contact/lead.medium —
 * see 0004_lead_medium.sql), never FK'd to a dictionary table, so its
 * own value doubles as both `key` and `label` with no join.
 *
 * Attribution basis, per dimension (documented because it's a real
 * choice, not an accident):
 *  - visitors: `visitor.first_touch_*` — true acquisition, immutable
 *    once set (docs/ATTRIBUTION.md).
 *  - leads: `lead.*` — resolved once, at lead-creation time.
 *  - purchases/revenue: `contact.first_touch_*` — first-touch
 *    attribution (see docs/ANALYTICS_ENGINE.md, "Revenue attribution",
 *    for why first-touch is the default and last-touch is the only
 *    alternative offered, not a full multi-touch model).
 */
const DIMENSION_SQL: Record<
  PerformanceDimension,
  { visitorColumn: string; leadColumn: string; contactColumn: string; dictionaryTable: string | null; dictionaryLabel: string }
> = {
  source: {
    visitorColumn: "first_touch_source_id",
    leadColumn: "source_id",
    contactColumn: "first_touch_source_id",
    dictionaryTable: "source",
    dictionaryLabel: "label",
  },
  campaign: {
    visitorColumn: "first_touch_campaign_id",
    leadColumn: "campaign_id",
    contactColumn: "first_touch_campaign_id",
    dictionaryTable: "campaign",
    dictionaryLabel: "name",
  },
  qr: {
    visitorColumn: "first_touch_qr_id",
    leadColumn: "qr_id",
    contactColumn: "first_touch_qr_id",
    dictionaryTable: "qr_source",
    dictionaryLabel: "slug",
  },
  medium: {
    visitorColumn: "first_touch_medium",
    leadColumn: "medium",
    contactColumn: "first_touch_medium",
    dictionaryTable: null,
    dictionaryLabel: "",
  },
};

export async function getPerformanceByDimension(
  db: Pool | PoolClient,
  dimension: PerformanceDimension,
  range: ResolvedDateRange,
): Promise<PerformanceRow[]> {
  const cfg = DIMENSION_SQL[dimension];
  // No dictionary table for a free-text dimension (medium): the raw
  // value itself is the label, so skip the join entirely rather than
  // joining a table name built from unvalidated input.
  const labelSelect = cfg.dictionaryTable ? `dict.${cfg.dictionaryLabel}` : "d.dim_id";
  const dictJoin = cfg.dictionaryTable ? `left join ${cfg.dictionaryTable} dict on dict.id = d.dim_id` : "";

  const { rows } = await db.query<{
    key: string | null;
    label: string | null;
    visitors: string;
    leads: string;
    purchases: string;
    revenue_cents: string;
  }>(
    `
    with visitors as (
      select v.${cfg.visitorColumn} as dim_id, count(*) as visitors
      from visitor v
      where v.first_touch_captured_at between $1 and $2
      group by v.${cfg.visitorColumn}
    ),
    leads as (
      select l.${cfg.leadColumn} as dim_id, count(*) as leads
      from lead l
      where l.created_at between $1 and $2
      group by l.${cfg.leadColumn}
    ),
    purchases as (
      select c.${cfg.contactColumn} as dim_id,
             count(distinct o.id) as purchases,
             coalesce(sum(o.total_cents), 0) as revenue_cents
      from orders o
      join contact c on c.id = o.contact_id
      where o.status = 'paid' and o.paid_at between $1 and $2
      group by c.${cfg.contactColumn}
    ),
    dim_ids as (
      select dim_id from visitors
      union select dim_id from leads
      union select dim_id from purchases
    )
    select
      d.dim_id as key,
      ${labelSelect} as label,
      coalesce(v.visitors, 0) as visitors,
      coalesce(l.leads, 0) as leads,
      coalesce(p.purchases, 0) as purchases,
      coalesce(p.revenue_cents, 0) as revenue_cents
    from dim_ids d
    -- "is not distinct from", not "=": the direct/no-attribution bucket
    -- is dim_id IS NULL, and NULL = NULL is UNKNOWN (never true) in SQL —
    -- a plain "=" join would silently drop that bucket's own numbers.
    left join visitors v on v.dim_id is not distinct from d.dim_id
    left join leads l on l.dim_id is not distinct from d.dim_id
    left join purchases p on p.dim_id is not distinct from d.dim_id
    ${dictJoin}
    order by revenue_cents desc, visitors desc
    `,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => {
    const visitors = Number(row.visitors);
    const leads = Number(row.leads);
    const purchases = Number(row.purchases);
    return {
      key: row.key,
      label: row.label ?? (row.key === null ? "direct" : row.key),
      visitors,
      leads,
      purchases,
      revenueCents: Number(row.revenue_cents),
      visitorToLeadRate: visitors > 0 ? leads / visitors : null,
      leadToPurchaseRate: leads > 0 ? purchases / leads : null,
    };
  });
}
