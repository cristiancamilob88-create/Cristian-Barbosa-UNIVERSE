import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/**
 * Revenue attribution: FIRST_TOUCH or LAST_TOUCH only — no multi-touch
 * model in this block (explicit instruction: "No implementar todavía un
 * complejo multi-touch attribution model"). Both read from `contact`,
 * which already carries both (docs/ATTRIBUTION.md) — no schema change
 * needed. Default is first-touch: "primero FIRST TOUCH ATTRIBUTION".
 */
export type AttributionMode = "first_touch" | "last_touch";

export interface RevenueBreakdownRow {
  key: string | null;
  label: string;
  purchases: number;
  revenueCents: number;
}

const DIMENSION_CONFIG = {
  source: { table: "source", labelColumn: "label" },
  campaign: { table: "campaign", labelColumn: "name" },
  qr: { table: "qr_source", labelColumn: "slug" },
} as const;

export type RevenueDimension = keyof typeof DIMENSION_CONFIG;

export async function getRevenueByDimension(
  db: Pool | PoolClient,
  dimension: RevenueDimension,
  attribution: AttributionMode,
  range: ResolvedDateRange,
): Promise<RevenueBreakdownRow[]> {
  const cfg = DIMENSION_CONFIG[dimension];
  const contactColumn = `${attribution}_${dimension === "qr" ? "qr_id" : `${dimension}_id`}`;

  const { rows } = await db.query<{ key: string | null; label: string | null; purchases: string; revenue_cents: string }>(
    `select c.${contactColumn} as key, dict.${cfg.labelColumn} as label,
            count(distinct o.id) as purchases, coalesce(sum(o.total_cents), 0) as revenue_cents
     from orders o
     join contact c on c.id = o.contact_id
     left join ${cfg.table} dict on dict.id = c.${contactColumn}
     where o.status = 'paid' and o.paid_at between $1 and $2
     group by c.${contactColumn}, dict.${cfg.labelColumn}
     order by revenue_cents desc`,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    key: row.key,
    label: row.label ?? (row.key === null ? "direct" : row.key),
    purchases: Number(row.purchases),
    revenueCents: Number(row.revenue_cents),
  }));
}

export interface ProductRevenueRow {
  productSlug: string;
  productName: string;
  offerSlug: string;
  purchases: number;
  revenueCents: number;
}

/** Read models 18–19: revenue by product and by offer, in one query (an offer always belongs to exactly one product). */
export async function getRevenueByProductAndOffer(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<ProductRevenueRow[]> {
  const { rows } = await db.query<{
    product_slug: string;
    product_name: string;
    offer_slug: string;
    purchases: string;
    revenue_cents: string;
  }>(
    `select p.slug as product_slug, p.name as product_name, of.slug as offer_slug,
            count(distinct oi.order_id) as purchases,
            coalesce(sum(oi.unit_price_cents * oi.quantity), 0) as revenue_cents
     from order_items oi
     join orders o on o.id = oi.order_id
     join offer of on of.id = oi.offer_id
     join product p on p.id = of.product_id
     where o.status = 'paid' and o.paid_at between $1 and $2
     group by p.slug, p.name, of.slug
     order by revenue_cents desc`,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    productSlug: row.product_slug,
    productName: row.product_name,
    offerSlug: row.offer_slug,
    purchases: Number(row.purchases),
    revenueCents: Number(row.revenue_cents),
  }));
}

export async function getTotalRevenue(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<{ purchases: number; revenueCents: number }> {
  const { rows } = await db.query<{ purchases: string; revenue_cents: string }>(
    `select count(*) as purchases, coalesce(sum(total_cents), 0) as revenue_cents
     from orders
     where status = 'paid' and paid_at between $1 and $2`,
    [range.from.toISOString(), range.to.toISOString()],
  );
  return { purchases: Number(rows[0].purchases), revenueCents: Number(rows[0].revenue_cents) };
}
