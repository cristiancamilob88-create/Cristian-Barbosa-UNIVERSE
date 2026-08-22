# KPI_DEFINITIONS.md

Every metric `getAnalyticsOverview()` (`src/server/analytics/overview.ts`)
returns, with its exact formula. Nothing here is ambiguous — if a metric
isn't defined below, it isn't a supported KPI yet; don't add one to the
overview object without adding its formula here in the same change.

## Base counts

All scoped to the requested date range (docs/ANALYTICS_ENGINE.md, "Date
ranges").

| KPI | Definition |
|---|---|
| **Visitors** | `COUNT(DISTINCT visitor_id)` across ALL `interaction` rows in range (any event). **Not** the same as "acquisition by source" (docs/REPORTING.md), which counts only visitors whose `visitor.first_touch_captured_at` falls in range — Visitors here includes returning visitors too. |
| **Sessions** | Count of gap-sessionized groups (30-min inactivity threshold) across all visitors in range — see docs/ANALYTICS_ENGINE.md, "Session model". |
| **Page Views** | `COUNT(*)` of `interaction` where `event_name = 'page_view'`. |
| **Landing Views** | `COUNT(*)` of `interaction` where `event_name = 'landing_view'`. |
| **CTA Clicks** | `COUNT(*)` where `event_name = 'cta_click'`. |
| **Social Clicks** | `COUNT(*)` where `event_name = 'social_click'`. |
| **WhatsApp Clicks** | `COUNT(*)` where `event_name = 'whatsapp_click'`. |
| **Outbound Clicks** | `COUNT(*)` where `event_name = 'outbound_click'` (non-social, non-WhatsApp `/go/` destinations). |
| **Leads** | `COUNT(*)` of `lead` rows created in range. |
| **Purchases** | `COUNT(*)` of `orders` where `status = 'paid'` and `paid_at` in range. |
| **Revenue** | `SUM(orders.total_cents)` under the same filter, in cents (COP — see docs/CRM.md). |

## Ratios

Each is `numerator / denominator`, `null` when the denominator is 0
(never divide-by-zero, never silently show 0% for "no data yet").

| Ratio | Formula |
|---|---|
| **Visitor → Lead** | Leads ÷ Visitors |
| **Landing → Lead** | Leads ÷ (distinct visitors with a `landing_view` in range) |
| **Lead → Purchase** | Purchases ÷ Leads |
| **Visitor → Purchase** | Purchases ÷ Visitors |
| **CTA → Lead** | Leads ÷ (distinct visitors with a `cta_click` in range) |
| **Checkout → Purchase** | Purchases ÷ (count of `checkout_started` events) — always `null` until Block 04 wires a checkout flow that fires it. |

`Landing → Lead` and `CTA → Lead` use **distinct visitors** who performed
the action, not raw event counts — a visitor landing twice shouldn't be
able to push a conversion rate above 100%.

## Revenue-per ratios

Only computed "cuando exista información suficiente" (denominator > 0),
`null` otherwise — never fabricated from a zero base.

| KPI | Formula |
|---|---|
| **Revenue per Visitor** | Revenue ÷ Visitors |
| **Revenue per Lead** | Revenue ÷ Leads |
| **Revenue per Purchase** | Revenue ÷ Purchases |

## What's deliberately not defined yet

CAC, ROAS, CPA, CPL — the brief is explicit: don't calculate these
without real ad-spend data, which doesn't exist in this system (no ad
platform integration — see docs/ARCHITECTURE.md §11 and "Future
Publicidad" in the Block 03 brief). Adding them without real spend data
would produce numbers that look precise but mean nothing.
