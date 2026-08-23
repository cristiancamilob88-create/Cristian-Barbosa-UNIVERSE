import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/**
 * One point of the Overview's "evolución temporal" (Block 04.1) — a
 * day's worth of the same core counters the KPI tiles already show, so
 * the sparkline and the tile always agree by construction (both derive
 * from the same tables, just one is summed and the other is bucketed).
 */
export interface DailyPoint {
  /** UTC day, `YYYY-MM-DD`. */
  date: string;
  visitors: number;
  leads: number;
  purchases: number;
  revenueCents: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Daily-bucketed visitors/leads/purchases/revenue over `range`, zero-filled
 * for every day with no activity — a sparkline reading a gap as "no data
 * fetched" instead of "zero that day" is a classic charting bug (see the
 * dataviz skill's anti-patterns). Bucketed by UTC day always, including
 * for the "today" preset (a single point/bar) — hourly bucketing was
 * considered and deferred as unnecessary complexity for an MVP trend
 * view (docs/COMMAND_CENTER.md).
 *
 * Deliberately excludes `sessions`: session bucketing needs the same
 * gap-sessionization window (src/server/analytics/sessions.ts) applied
 * per day, which double-counts a session that spans midnight — not
 * worth the complexity for a trend line when visitors/leads/purchases
 * already show the same shape.
 */
export async function getDailySeries(db: Pool | PoolClient, range: ResolvedDateRange): Promise<DailyPoint[]> {
  const { rows } = await db.query<{
    day: string;
    visitors: string;
    leads: string;
    purchases: string;
    revenue_cents: string;
  }>(
    `
    with visitor_days as (
      select date_trunc('day', created_at) as day, count(distinct visitor_id) as visitors
      from interaction
      where created_at between $1 and $2
      group by 1
    ),
    lead_days as (
      select date_trunc('day', created_at) as day, count(*) as leads
      from lead
      where created_at between $1 and $2
      group by 1
    ),
    purchase_days as (
      select date_trunc('day', paid_at) as day, count(*) as purchases, coalesce(sum(total_cents), 0) as revenue_cents
      from orders
      where status = 'paid' and paid_at between $1 and $2
      group by 1
    ),
    days as (
      select day from visitor_days
      union select day from lead_days
      union select day from purchase_days
    )
    select
      to_char(d.day, 'YYYY-MM-DD') as day,
      coalesce(v.visitors, 0) as visitors,
      coalesce(l.leads, 0) as leads,
      coalesce(p.purchases, 0) as purchases,
      coalesce(p.revenue_cents, 0) as revenue_cents
    from days d
    left join visitor_days v on v.day = d.day
    left join lead_days l on l.day = d.day
    left join purchase_days p on p.day = d.day
    order by d.day asc
    `,
    [range.from.toISOString(), range.to.toISOString()],
  );

  const byDay = new Map(
    rows.map((row) => [
      row.day,
      {
        visitors: Number(row.visitors),
        leads: Number(row.leads),
        purchases: Number(row.purchases),
        revenueCents: Number(row.revenue_cents),
      },
    ]),
  );

  // Zero-fill every day in [range.from, range.to], not just days that
  // had rows — a real gap must render as zero, never be silently skipped.
  const points: DailyPoint[] = [];
  const startDay = new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate()));
  const endDay = new Date(Date.UTC(range.to.getUTCFullYear(), range.to.getUTCMonth(), range.to.getUTCDate()));
  for (let t = startDay.getTime(); t <= endDay.getTime(); t += MS_PER_DAY) {
    const key = toDayKey(new Date(t));
    const found = byDay.get(key);
    points.push({
      date: key,
      visitors: found?.visitors ?? 0,
      leads: found?.leads ?? 0,
      purchases: found?.purchases ?? 0,
      revenueCents: found?.revenueCents ?? 0,
    });
  }
  return points;
}
