import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/**
 * Per-campaign performance — the click-level funnel (visits → landing
 * views → CTA clicks → WhatsApp clicks → leads → purchases), keyed by
 * `campaign.slug` the same way `getQrPerformance()` (`./qr.ts`) is
 * keyed by `qr_source.slug`. Distinct from `getPerformanceByDimension(
 * db, "campaign", range)` (`./performance.ts`, powers the existing "Por
 * campaña" table on /admin/fuentes): that one is the general
 * visitors/leads/purchases/revenue/conversion comparison across every
 * dimension (source/campaign/qr/medium) and is keyed by campaign *id*,
 * not slug, so it can't power a slug-addressed detail page. This is
 * the "how is this ONE campaign doing" view Cristian asked for
 * (2026-08-28, after Concordia) — same funnel depth as the QR
 * performance table, just aggregated by campaign_id instead of qr_id
 * (a campaign can in principle have more than one qr_source row).
 *
 * Always returns every campaign, same as `getQrPerformance()` — the
 * admin list page (`/admin/campanas`) renders the whole table, and the
 * detail page (`/admin/campanas/[slug]`) just picks its one row out of
 * the same response instead of a second query, since there are only a
 * handful of campaigns at this scale.
 *
 * `destinationPaths` (2026-09-12, Cristian's ask — he kept having to
 * request the campaign's link every time): every distinct
 * `qr_source.destination_path` registered against this campaign, so
 * /admin/campanas can link straight to the live page. An array, not a
 * single string, because a campaign can in principle have more than
 * one qr_source row (this doc's own note above) — usually 0 or 1 in
 * practice today.
 */
export interface CampaignDetailRow {
  campaignSlug: string;
  campaignName: string;
  status: string;
  visits: number;
  landingViews: number;
  ctaClicks: number;
  whatsappClicks: number;
  leads: number;
  purchases: number;
  revenueCents: number;
  destinationPaths: string[];
}

export async function getCampaignDetail(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<CampaignDetailRow[]> {
  const { rows } = await db.query<{
    campaign_slug: string;
    campaign_name: string;
    status: string;
    visits: string;
    landing_views: string;
    cta_clicks: string;
    whatsapp_clicks: string;
    leads: string;
    purchases: string;
    revenue_cents: string;
    destination_paths: string[] | null;
  }>(
    `
    with visits as (
      select first_touch_campaign_id as campaign_id, count(*) as visits
      from visitor
      where first_touch_campaign_id is not null and first_touch_captured_at between $1 and $2
      group by first_touch_campaign_id
    ),
    events as (
      select campaign_id,
             count(*) filter (where event_name = 'landing_view') as landing_views,
             count(*) filter (where event_name = 'cta_click') as cta_clicks,
             count(*) filter (where event_name = 'whatsapp_click') as whatsapp_clicks
      from interaction
      where campaign_id is not null and created_at between $1 and $2
      group by campaign_id
    ),
    leads as (
      select campaign_id, count(*) as leads
      from lead
      where campaign_id is not null and created_at between $1 and $2
      group by campaign_id
    ),
    purchases as (
      select c.first_touch_campaign_id as campaign_id, count(distinct o.id) as purchases, coalesce(sum(o.total_cents), 0) as revenue_cents
      from orders o
      join contact c on c.id = o.contact_id
      where c.first_touch_campaign_id is not null and o.status = 'paid' and o.paid_at between $1 and $2
      group by c.first_touch_campaign_id
    ),
    destinations as (
      -- Not date-ranged, on purpose: a campaign's live page(s) don't
      -- come and go with the selected reporting window.
      select campaign_id, array_agg(distinct destination_path order by destination_path) as destination_paths
      from qr_source
      where campaign_id is not null
      group by campaign_id
    )
    select
      c.slug as campaign_slug,
      c.name as campaign_name,
      c.status,
      coalesce(v.visits, 0) as visits,
      coalesce(e.landing_views, 0) as landing_views,
      coalesce(e.cta_clicks, 0) as cta_clicks,
      coalesce(e.whatsapp_clicks, 0) as whatsapp_clicks,
      coalesce(l.leads, 0) as leads,
      coalesce(p.purchases, 0) as purchases,
      coalesce(p.revenue_cents, 0) as revenue_cents,
      d.destination_paths
    from campaign c
    left join visits v on v.campaign_id = c.id
    left join events e on e.campaign_id = c.id
    left join leads l on l.campaign_id = c.id
    left join purchases p on p.campaign_id = c.id
    left join destinations d on d.campaign_id = c.id
    order by visits desc
    `,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    campaignSlug: row.campaign_slug,
    campaignName: row.campaign_name,
    status: row.status,
    visits: Number(row.visits),
    landingViews: Number(row.landing_views),
    ctaClicks: Number(row.cta_clicks),
    whatsappClicks: Number(row.whatsapp_clicks),
    leads: Number(row.leads),
    purchases: Number(row.purchases),
    revenueCents: Number(row.revenue_cents),
    destinationPaths: row.destination_paths ?? [],
  }));
}
