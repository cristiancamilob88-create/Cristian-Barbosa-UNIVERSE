import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";
import { INTERACTION_EVENT_NAMES, type InteractionEventName } from "@/server/db/repositories/interaction";

export interface EventCountRow {
  eventName: InteractionEventName;
  count: number;
  uniqueVisitors: number;
}

/** Read models 6–9: landing views, CTA clicks, social clicks, WhatsApp clicks — plus every other taxonomy event, for free. */
export async function getEventCounts(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<EventCountRow[]> {
  const { rows } = await db.query<{ event_name: InteractionEventName; count: string; unique_visitors: string }>(
    `select event_name, count(*) as count, count(distinct visitor_id) as unique_visitors
     from interaction
     where created_at between $1 and $2
     group by event_name`,
    [range.from.toISOString(), range.to.toISOString()],
  );

  const byName = new Map(rows.map((r) => [r.event_name, r]));
  // Always return every taxonomy event, zero-filled — a dashboard reading
  // this shouldn't have to guess whether a missing key means "zero" or
  // "the query forgot this event".
  return INTERACTION_EVENT_NAMES.map((eventName) => {
    const row = byName.get(eventName);
    return {
      eventName,
      count: row ? Number(row.count) : 0,
      uniqueVisitors: row ? Number(row.unique_visitors) : 0,
    };
  });
}

export interface LandingRow {
  route: string;
  views: number;
  uniqueVisitors: number;
  ctaClicks: number;
  leadConversions: number;
  purchaseConversions: number;
}

/**
 * Read model 5 + "LANDING PERFORMANCE": views/unique visitors/CTA clicks
 * come straight from `interaction.route`. Lead/purchase conversion is
 * attributed to a route via `contact.first_touch_landing_path` — the
 * page a contact actually *entered on*, which is what "does /entrenar
 * convert better than /musica" means; a lead created from /contacto
 * itself isn't a pillar landing.
 */
export async function getLandingPerformance(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<LandingRow[]> {
  const { rows } = await db.query<{
    route: string;
    views: string;
    unique_visitors: string;
    cta_clicks: string;
    lead_conversions: string;
    purchase_conversions: string;
  }>(
    `
    with views as (
      select route,
             count(*) filter (where event_name in ('page_view', 'landing_view')) as views,
             count(distinct visitor_id) as unique_visitors,
             count(*) filter (where event_name = 'cta_click') as cta_clicks
      from interaction
      where created_at between $1 and $2 and route is not null
      group by route
    ),
    leads as (
      select c.first_touch_landing_path as route, count(distinct l.id) as lead_conversions
      from lead l
      join contact c on c.id = l.contact_id
      where l.created_at between $1 and $2 and c.first_touch_landing_path is not null
      group by c.first_touch_landing_path
    ),
    purchases as (
      select c.first_touch_landing_path as route, count(distinct o.id) as purchase_conversions
      from orders o
      join contact c on c.id = o.contact_id
      where o.status = 'paid' and o.paid_at between $1 and $2 and c.first_touch_landing_path is not null
      group by c.first_touch_landing_path
    )
    select
      v.route,
      v.views,
      v.unique_visitors,
      v.cta_clicks,
      coalesce(l.lead_conversions, 0) as lead_conversions,
      coalesce(p.purchase_conversions, 0) as purchase_conversions
    from views v
    left join leads l on l.route = v.route
    left join purchases p on p.route = v.route
    order by v.views desc
    `,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    route: row.route,
    views: Number(row.views),
    uniqueVisitors: Number(row.unique_visitors),
    ctaClicks: Number(row.cta_clicks),
    leadConversions: Number(row.lead_conversions),
    purchaseConversions: Number(row.purchase_conversions),
  }));
}
