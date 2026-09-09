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
  /**
   * Average dwell time on this route, in seconds — `null` when no
   * sample exists yet (never a fabricated 0). See the query comment
   * below for how this is derived; asked for by Cristian 2026-08-25
   * ("cuánto tiempo... observando cada página").
   */
  avgDwellSeconds: number | null;
}

/**
 * Read model 5 + "LANDING PERFORMANCE": views/unique visitors/CTA clicks
 * come straight from `interaction.route`. Lead/purchase conversion is
 * attributed to a route via `contact.first_touch_landing_path` — the
 * page a contact actually *entered on*, which is what "does /entrenar
 * convert better than /musica" means; a lead created from /contacto
 * itself isn't a pillar landing.
 *
 * `avgDwellSeconds` is the same lag()-window-function idea as
 * `sessions.ts`'s gap-sessionization, just grouped by route instead of
 * by session: for every `page_view`/`landing_view` on a route, dwell
 * time is the gap until that same visitor's *next* interaction
 * (whatever route/event it is — a CTA click on the same page still
 * means they were engaged on it). No new tracking, no new event, no
 * vendor — this is derived entirely from data already being recorded.
 * Two real limits, both inherent to deriving this from event gaps
 * rather than an exit beacon: the last event of a session has no
 * "next" event, so it contributes no sample (excluded, never guessed
 * at); and a gap over the same 30-minute inactivity threshold used for
 * sessions is excluded too (a tab left open isn't "reading the page for
 * 45 minutes"). A route with a real dwell-time answer some day but none
 * yet resolves to `null` here, formatted as an em dash
 * (`formatDuration`), never a fabricated 0:00.
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
    avg_dwell_seconds: string | null;
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
    ordered as (
      select route, event_name, created_at,
             lead(created_at) over (partition by visitor_id order by created_at) as next_created_at
      from interaction
      where created_at between $1 and $2
    ),
    dwell as (
      select route, extract(epoch from (next_created_at - created_at)) as dwell_seconds
      from ordered
      where event_name in ('page_view', 'landing_view')
        and route is not null
        and next_created_at is not null
        and next_created_at - created_at <= interval '30 minutes'
    ),
    dwell_agg as (
      select route, avg(dwell_seconds) as avg_dwell_seconds
      from dwell
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
      coalesce(p.purchase_conversions, 0) as purchase_conversions,
      d.avg_dwell_seconds
    from views v
    left join leads l on l.route = v.route
    left join purchases p on p.route = v.route
    left join dwell_agg d on d.route = v.route
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
    avgDwellSeconds: row.avg_dwell_seconds !== null ? Number(row.avg_dwell_seconds) : null,
  }));
}

export interface CtaRow {
  /** The `cta` id every `TrackedLink` call site sets (e.g. `intent_training`, `ver_universo_completo`) — see docs/UNIVERSE_UX.md. */
  cta: string;
  route: string | null;
  topic: string | null;
  clicks: number;
  uniqueVisitors: number;
}

/**
 * CTA breakdown, added 2026-09-09 at Cristian's own request (he saw
 * "Clics en CTA" totals on Overview/Landings/QR/Campañas and asked
 * "exactamente cuando suma un clic en CTA, ese CTA cuál es?"). Those
 * totals are `count(*) where event_name = 'cta_click'` — one number for
 * every button on the site. This is the same underlying rows, grouped
 * by (cta, route) instead of collapsed into one total, since `cta` is
 * free text in `interaction.metadata` (not a dictionary table — same
 * "no join" shape as `medium`, docs/ANALYTICS_ENGINE.md "Segmentation"),
 * never itself unique: several different buttons can share one `cta` id
 * on purpose (e.g. every "Ver todo el universo" button uses
 * `ver_universo_completo`), so `route` is included as the next-best
 * disambiguator the schema actually has — this still can't tell two
 * same-`cta`-same-`route` buttons apart, and says so wherever it's
 * surfaced rather than implying it can.
 *
 * No lead/purchase conversion column here, unlike `getLandingPerformance`:
 * conversion is attributed to `contact.first_touch_landing_path` (a
 * route, not a button), so a fabricated "CTA → lead" number would imply
 * a link this schema doesn't actually track.
 */
export async function getCtaPerformance(db: Pool | PoolClient, range: ResolvedDateRange): Promise<CtaRow[]> {
  const { rows } = await db.query<{
    cta: string;
    route: string | null;
    topic: string | null;
    clicks: string;
    unique_visitors: string;
  }>(
    `
    select
      coalesce(metadata->>'cta', '(sin id)') as cta,
      route,
      metadata->>'topic' as topic,
      count(*) as clicks,
      count(distinct visitor_id) as unique_visitors
    from interaction
    where event_name = 'cta_click' and created_at between $1 and $2
    group by cta, route, topic
    order by clicks desc
    `,
    [range.from.toISOString(), range.to.toISOString()],
  );

  return rows.map((row) => ({
    cta: row.cta,
    route: row.route,
    topic: row.topic,
    clicks: Number(row.clicks),
    uniqueVisitors: Number(row.unique_visitors),
  }));
}
