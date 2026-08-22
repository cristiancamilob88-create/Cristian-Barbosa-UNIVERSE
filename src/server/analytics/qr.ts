import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/**
 * QR performance, matching the brief's own worked example shape
 * (QR Aura → visits → training views → WhatsApp clicks → leads →
 * purchases). "Visits" is acquisition (`visitor.first_touch_qr_id` —
 * true first scan, immutable), the funnel steps in between are
 * per-event snapshots (`interaction.qr_id`), leads/purchases follow the
 * same first-touch-QR attribution as `performance.ts`.
 */
export interface QrPerformanceRow {
  qrSlug: string;
  destinationPath: string;
  active: boolean;
  visits: number;
  landingViews: number;
  ctaClicks: number;
  whatsappClicks: number;
  leads: number;
  purchases: number;
  revenueCents: number;
}

export async function getQrPerformance(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<QrPerformanceRow[]> {
  const { rows } = await db.query<{
    qr_slug: string;
    destination_path: string;
    active: boolean;
    visits: string;
    landing_views: string;
    cta_clicks: string;
    whatsapp_clicks: string;
    leads: string;
    purchases: string;
    revenue_cents: string;
  }>(
    `
    with visits as (
      select first_touch_qr_id as qr_id, count(*) as visits
      from visitor
      where first_touch_qr_id is not null and first_touch_captured_at between $1 and $2
      group by first_touch_qr_id
    ),
    events as (
      select qr_id,
             count(*) filter (where event_name = 'landing_view') as landing_views,
             count(*) filter (where event_name = 'cta_click') as cta_clicks,
             count(*) filter (where event_name = 'whatsapp_click') as whatsapp_clicks
      from interaction
      where qr_id is not null and created_at between $1 and $2
      group by qr_id
    ),
    leads as (
      select qr_id, count(*) as leads
      from lead
      where qr_id is not null and created_at between $1 and $2
      group by qr_id
    ),
    purchases as (
      select c.first_touch_qr_id as qr_id, count(distinct o.id) as purchases, coalesce(sum(o.total_cents), 0) as revenue_cents
      from orders o
      join contact c on c.id = o.contact_id
      where c.first_touch_qr_id is not null and o.status = 'paid' and o.paid_at between $1 and $2
      group by c.first_touch_qr_id
    )
    select
      q.slug as qr_slug,
      q.destination_path,
      q.active,
      coalesce(v.visits, 0) as visits,
      coalesce(e.landing_views, 0) as landing_views,
      coalesce(e.cta_clicks, 0) as cta_clicks,
      coalesce(e.whatsapp_clicks, 0) as whatsapp_clicks,
      coalesce(l.leads, 0) as leads,
      coalesce(p.purchases, 0) as purchases,
      coalesce(p.revenue_cents, 0) as revenue_cents
    from qr_source q
    left join visits v on v.qr_id = q.id
    left join events e on e.qr_id = q.id
    left join leads l on l.qr_id = q.id
    left join purchases p on p.qr_id = q.id
    order by visits desc
    `,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    qrSlug: row.qr_slug,
    destinationPath: row.destination_path,
    active: row.active,
    visits: Number(row.visits),
    landingViews: Number(row.landing_views),
    ctaClicks: Number(row.cta_clicks),
    whatsappClicks: Number(row.whatsapp_clicks),
    leads: Number(row.leads),
    purchases: Number(row.purchases),
    revenueCents: Number(row.revenue_cents),
  }));
}
