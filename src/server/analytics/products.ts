import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

export interface ProductViewRow {
  productSlug: string;
  productName: string;
  views: number;
  uniqueVisitors: number;
}

/**
 * "Qué contenido/producto le interesó" — reads `interaction` rows with
 * `entity_type = 'product'` (see 0003_analytics_engine.sql). No UI fires
 * these yet (no per-product detail page exists — see docs/CRM.md); this
 * is the read model Block 04's real catalog pages will already have
 * data flowing into on day one.
 */
export async function getProductViews(db: Pool | PoolClient, range: ResolvedDateRange): Promise<ProductViewRow[]> {
  const { rows } = await db.query<{
    product_slug: string;
    product_name: string;
    views: string;
    unique_visitors: string;
  }>(
    `select p.slug as product_slug, p.name as product_name,
            count(*) as views, count(distinct i.visitor_id) as unique_visitors
     from interaction i
     join product p on p.id = i.entity_id
     where i.entity_type = 'product' and i.event_name = 'product_view'
       and i.created_at between $1 and $2
     group by p.slug, p.name
     order by views desc`,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    productSlug: row.product_slug,
    productName: row.product_name,
    views: Number(row.views),
    uniqueVisitors: Number(row.unique_visitors),
  }));
}
