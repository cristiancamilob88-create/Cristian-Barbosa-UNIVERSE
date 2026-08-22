import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

export interface SocialPerformanceRow {
  platform: string;
  slug: string;
  clicks: number;
  uniqueVisitors: number;
}

/**
 * "SOCIAL PERFORMANCE": clicks recorded by /go/[slug]
 * (social_click/whatsapp_click/outbound_click — docs/SOCIAL_ROUTING.md),
 * grouped by the platform/slug stashed in `interaction.metadata` at
 * write time. This only measures the Universe → click → redirect step,
 * per the brief's own boundary ("no intentar medir el comportamiento
 * interno de Instagram/Facebook/TikTok").
 */
export async function getSocialPerformance(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<SocialPerformanceRow[]> {
  const { rows } = await db.query<{ platform: string; slug: string; clicks: string; unique_visitors: string }>(
    `select
       metadata->>'platform' as platform,
       metadata->>'slug' as slug,
       count(*) as clicks,
       count(distinct visitor_id) as unique_visitors
     from interaction
     where event_name in ('social_click', 'whatsapp_click', 'outbound_click')
       and created_at between $1 and $2
     group by metadata->>'platform', metadata->>'slug'
     order by clicks desc`,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    platform: row.platform,
    slug: row.slug,
    clicks: Number(row.clicks),
    uniqueVisitors: Number(row.unique_visitors),
  }));
}
