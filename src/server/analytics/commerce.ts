import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";

/**
 * "Clientes" (Block 05's "Dashboard comercial" list) — distinct
 * contacts with at least one paid order in range. Deliberately not
 * "total orders" (a repeat customer would inflate that) and not
 * "total contacts" (most contacts are leads, never customers) — this
 * is the CRM's own `lead → customer` distinction the brief asked this
 * block to keep explicit (docs/COMMERCE.md, "visitor → contact → lead
 * → customer").
 */
export interface CustomerSummary {
  total: number;
}

export async function getCustomerSummary(db: Pool | PoolClient, range: ResolvedDateRange): Promise<CustomerSummary> {
  const { rows } = await db.query<{ total: string }>(
    `select count(distinct contact_id) as total
     from orders
     where status = 'paid' and paid_at between $1 and $2`,
    [range.from.toISOString(), range.to.toISOString()],
  );
  return { total: Number(rows[0].total) };
}

/**
 * "Suscripciones" — the one read model in this codebase that queries
 * `subscription` (Block 02 schema, never read by any analytics before
 * this block since nothing wrote to it yet either). `active`/`paused`/
 * `cancelled` are CURRENT totals (a subscription's status right now,
 * not range-filtered — "how many active members do we have" doesn't
 * mean "as of the selected date range"); `started`/`cancelledInRange`
 * ARE range-filtered — genuine activity counts for the period.
 *
 * No `expired` status: the brief's own instruction was to add it only
 * "si realmente son necesarios" — `active`/`paused`/`cancelled` already
 * covers the full lifecycle Block 02's schema defined, and no real
 * subscription provider is connected yet to produce an `expired` case
 * distinct from `cancelled`. See docs/COMMERCE.md.
 */
export interface SubscriptionSummary {
  active: number;
  paused: number;
  cancelled: number;
  startedInRange: number;
  cancelledInRange: number;
}

export async function getSubscriptionSummary(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<SubscriptionSummary> {
  // Sequential, not Promise.all: `db` may be a single PoolClient (one
  // Postgres connection), which cannot run overlapping queries safely —
  // see reference.ts's resolveTouch() for the same fix and full rationale.
  const currentStatus = await db.query<{ status: string; count: string }>(
    "select status, count(*) as count from subscription group by status",
  );
  const activity = await db.query<{ started: string; cancelled: string }>(
    `select
       count(*) filter (where started_at between $1 and $2) as started,
       count(*) filter (where cancelled_at between $1 and $2) as cancelled
     from subscription`,
    [range.from.toISOString(), range.to.toISOString()],
  );

  const byStatus = new Map(currentStatus.rows.map((r) => [r.status, Number(r.count)]));

  return {
    active: byStatus.get("active") ?? 0,
    paused: byStatus.get("paused") ?? 0,
    cancelled: byStatus.get("cancelled") ?? 0,
    startedInRange: Number(activity.rows[0]?.started ?? 0),
    cancelledInRange: Number(activity.rows[0]?.cancelled ?? 0),
  };
}
