import "server-only";
import type { Pool, PoolClient } from "pg";
import type { ResolvedDateRange } from "./dateRange";
import { getEventCounts } from "./engagement";
import { getSessionSummary } from "./sessions";
import { getTotalLeads } from "./leads";
import { getTotalRevenue } from "./revenue";
import type { InteractionEventName } from "@/server/db/repositories/interaction";

/**
 * The single overview KPI object — every formula here is documented,
 * word for word, in docs/KPI_DEFINITIONS.md. Don't add a metric to this
 * object without adding its formula there too.
 */
export interface AnalyticsOverview {
  visitors: number;
  sessions: number;
  avgSessionDurationSeconds: number;
  avgPagesPerSession: number;
  pageViews: number;
  landingViews: number;
  ctaClicks: number;
  socialClicks: number;
  whatsappClicks: number;
  outboundClicks: number;
  leads: number;
  purchases: number;
  revenueCents: number;
  ratios: {
    visitorToLead: number | null;
    landingToLead: number | null;
    leadToPurchase: number | null;
    visitorToPurchase: number | null;
    ctaToLead: number | null;
    checkoutToPurchase: number | null;
  };
  revenuePerVisitor: number | null;
  revenuePerLead: number | null;
  revenuePerPurchase: number | null;
}

export async function getAnalyticsOverview(
  db: Pool | PoolClient,
  range: ResolvedDateRange,
): Promise<AnalyticsOverview> {
  // Sequential, not Promise.all: `db` may be a single PoolClient, which
  // cannot run overlapping queries safely — see reference.ts's
  // resolveTouch() for the same fix and full rationale. Route handlers
  // always pass a Pool here today (see src/app/api/analytics/overview/route.ts),
  // where this has no performance cost either way, but the function's own
  // `Pool | PoolClient` signature has to stay correct for either.
  const eventCounts = await getEventCounts(db, range);
  const sessionSummary = await getSessionSummary(db, range);
  const leads = await getTotalLeads(db, range);
  const revenue = await getTotalRevenue(db, range);

  const byName = new Map(eventCounts.map((row) => [row.eventName, row]));
  const get = (name: InteractionEventName) => byName.get(name) ?? { count: 0, uniqueVisitors: 0 };

  // "Visitors" here is every distinct visitor active in range (any
  // event), not just newly-acquired ones — see docs/KPI_DEFINITIONS.md
  // for why this differs from "acquisition by source" (first-touch-in-range only).
  const visitors = sessionSummary.visitors;
  const landingViewVisitors = get("landing_view").uniqueVisitors;
  const ctaClickVisitors = get("cta_click").uniqueVisitors;
  const checkoutStartedCount = get("checkout_started").count;

  const ratio = (numerator: number, denominator: number): number | null =>
    denominator > 0 ? numerator / denominator : null;

  return {
    visitors,
    sessions: sessionSummary.sessions,
    avgSessionDurationSeconds: sessionSummary.avgDurationSeconds,
    avgPagesPerSession: sessionSummary.avgPagesPerSession,
    pageViews: get("page_view").count,
    landingViews: get("landing_view").count,
    ctaClicks: get("cta_click").count,
    socialClicks: get("social_click").count,
    whatsappClicks: get("whatsapp_click").count,
    outboundClicks: get("outbound_click").count,
    leads,
    purchases: revenue.purchases,
    revenueCents: revenue.revenueCents,
    ratios: {
      visitorToLead: ratio(leads, visitors),
      landingToLead: ratio(leads, landingViewVisitors),
      leadToPurchase: ratio(revenue.purchases, leads),
      visitorToPurchase: ratio(revenue.purchases, visitors),
      ctaToLead: ratio(leads, ctaClickVisitors),
      checkoutToPurchase: ratio(revenue.purchases, checkoutStartedCount),
    },
    revenuePerVisitor: ratio(revenue.revenueCents, visitors),
    revenuePerLead: ratio(revenue.revenueCents, leads),
    revenuePerPurchase: ratio(revenue.revenueCents, revenue.purchases),
  };
}
