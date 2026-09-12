/**
 * Client-side contract for `/api/analytics/*` — the ONLY place the
 * Command Center's React components know these response shapes. No
 * component queries Postgres or imports anything from `src/server/`;
 * every section fetches JSON from an existing endpoint and renders it
 * (AGENTS.md: "no crear lógica de analytics en componentes React").
 *
 * Types here are a deliberate, hand-kept mirror of `src/server/analytics/*`'s
 * exported interfaces (docs/COMMAND_CENTER.md, "Why the client types are
 * duplicated, not imported") — not the read models themselves, and not a
 * new analytics layer: this is the DTO boundary between the API and its
 * one caller. If a route's shape here goes stale, its own integration
 * test (`route.integration.test.ts`) or `npm run typecheck` on this
 * file's callers is the signal to update it.
 */

export type DateRangePreset = "today" | "7d" | "30d" | "90d";

export interface RangeQuery {
  range?: DateRangePreset;
  from?: string;
  to?: string;
}

export interface ResolvedRange {
  from: string;
  to: string;
}

export class AnalyticsApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AnalyticsApiError";
    this.status = status;
  }
}

/**
 * The immediately-preceding, equal-length window before `resolved` —
 * "vs. período anterior" (Block 04.1, FASE "Comparaciones temporales").
 * Pure function, computed client-side from the range the API already
 * echoed back: no backend change, no new endpoint — the comparison is
 * just a second fetch of the same endpoint with a shifted `from`/`to`.
 */
export function previousRangeOf(resolved: ResolvedRange): RangeQuery {
  const from = new Date(resolved.from).getTime();
  const to = new Date(resolved.to).getTime();
  const durationMs = to - from;
  return { from: new Date(from - durationMs).toISOString(), to: new Date(from).toISOString() };
}

/** Builds the query string every /api/analytics/* route parses identically (src/server/analytics/dateRange.ts). */
export function buildQuery(range: RangeQuery, extra: Record<string, string | undefined> = {}): string {
  const qs = new URLSearchParams();
  if (range.from) {
    qs.set("from", range.from);
    if (range.to) qs.set("to", range.to);
  } else {
    qs.set("range", range.range ?? "30d");
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined) qs.set(key, value);
  }
  return qs.toString();
}

/**
 * Fetches one `/api/analytics/<path>` endpoint. `credentials: "same-origin"`
 * (the default) is enough — the admin session cookie is same-origin and
 * httpOnly, sent automatically; nothing here ever handles a bearer token
 * (docs/COMMAND_CENTER.md, "Authentication model"). `cache: "no-store"`:
 * this is Cristian's own live business data, never stale from the
 * browser's HTTP cache.
 */
export async function fetchAnalytics<T>(path: string, range: RangeQuery, extra?: Record<string, string | undefined>): Promise<T> {
  const qs = buildQuery(range, extra);
  const res = await fetch(`/api/analytics/${path}?${qs}`, { cache: "no-store" });

  let body: { ok?: boolean; error?: string } & Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    // fall through — !res.ok below still produces a useful error
  }

  if (!res.ok || body.ok !== true) {
    throw new AnalyticsApiError(res.status, body.error ?? `La solicitud falló (${res.status}).`);
  }
  return body as T;
}

// ---- Response shapes, one per endpoint (docs/REPORTING.md) ----

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

export interface LeadBreakdownRow {
  key: string | null;
  label: string;
  leads: number;
}

export interface SocialPerformanceRow {
  platform: string;
  slug: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface DailyPoint {
  date: string;
  visitors: number;
  leads: number;
  purchases: number;
  revenueCents: number;
}

export interface OverviewResponse {
  ok: true;
  range: ResolvedRange;
  data: AnalyticsOverview;
  leadsByInterest: LeadBreakdownRow[];
  social: SocialPerformanceRow[];
  timeseries: DailyPoint[];
}

export interface PerformanceRow {
  key: string | null;
  label: string;
  visitors: number;
  leads: number;
  purchases: number;
  revenueCents: number;
  visitorToLeadRate: number | null;
  leadToPurchaseRate: number | null;
}

export interface PerformanceResponse {
  ok: true;
  range: ResolvedRange;
  data: PerformanceRow[];
}

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

export interface QrResponse {
  ok: true;
  range: ResolvedRange;
  data: QrPerformanceRow[];
}

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
  /** Every distinct live-page path (`qr_source.destination_path`) registered against this campaign — see src/server/analytics/campaignDetail.ts. */
  destinationPaths: string[];
}

export interface CampaignDetailResponse {
  ok: true;
  range: ResolvedRange;
  data: CampaignDetailRow[];
}

export interface LandingRow {
  route: string;
  views: number;
  uniqueVisitors: number;
  ctaClicks: number;
  leadConversions: number;
  purchaseConversions: number;
  avgDwellSeconds: number | null;
}

export interface LandingsResponse {
  ok: true;
  range: ResolvedRange;
  data: LandingRow[];
}

export interface CtaRow {
  cta: string;
  route: string | null;
  topic: string | null;
  clicks: number;
  uniqueVisitors: number;
}

export interface CtasResponse {
  ok: true;
  range: ResolvedRange;
  data: CtaRow[];
}

export interface ProductViewRow {
  productSlug: string;
  productName: string;
  views: number;
  uniqueVisitors: number;
}

export interface ProductRevenueRow {
  productSlug: string;
  productName: string;
  offerSlug: string;
  purchases: number;
  revenueCents: number;
}

export interface ProductsResponse {
  ok: true;
  range: ResolvedRange;
  data: { views: ProductViewRow[]; revenue: ProductRevenueRow[] };
}

export interface FunnelStepResult {
  name: string;
  event: string;
  visitors: number;
  conversionFromPrevious: number | null;
  conversionFromFirst: number | null;
}

export interface FunnelResponse {
  ok: true;
  range: ResolvedRange;
  data: FunnelStepResult[];
}

export type AttributionMode = "first_touch" | "last_touch";

export interface RevenueBreakdownRow {
  key: string | null;
  label: string;
  purchases: number;
  revenueCents: number;
}

export interface RevenueResponse {
  ok: true;
  range: ResolvedRange;
  attribution: AttributionMode;
  data: {
    total: { purchases: number; revenueCents: number };
    bySource: RevenueBreakdownRow[];
    byCampaign: RevenueBreakdownRow[];
    byQr: RevenueBreakdownRow[];
    byProductAndOffer: ProductRevenueRow[];
    /** Block 05 — distinct paying contacts in range (see getCustomerSummary()). */
    customers: { total: number };
  };
}

export interface SubscriptionSummary {
  active: number;
  paused: number;
  cancelled: number;
  startedInRange: number;
  cancelledInRange: number;
}

export interface SubscriptionsResponse {
  ok: true;
  range: ResolvedRange;
  data: SubscriptionSummary;
}

export interface RecentLeadRow {
  id: string;
  topicRaw: string;
  status: string;
  interestLabel: string | null;
  sourceLabel: string | null;
  campaignLabel: string | null;
  qrSlug: string | null;
  medium: string | null;
  createdAt: string;
}

export interface LeadsResponse {
  ok: true;
  range: ResolvedRange;
  data: RecentLeadRow[];
}
