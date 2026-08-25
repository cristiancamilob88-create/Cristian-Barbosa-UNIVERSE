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
| **Duración promedio** | `AVG(session duration)`, where a session's duration is `MAX(created_at) - MIN(created_at)` across its events — 0 for a genuine one-event session, not `null` (there's a real answer, it's just zero). Computed by `getSessionSummary()` (`src/server/analytics/sessions.ts`); surfaced on the Overview since 2026-08-25 — the query existed earlier but its result was discarded before reaching the API response. |
| **Páginas / sesión** | `AVG(page_count)` per gap-sessionized group, same source as Duración promedio. |
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
(never divide-by-zero, never silently show 0% for "no data yet"). Names
here stay in English/internal-jargon terms — this doc is for the code,
not the UI. The dashboard itself is fully Spanish since 2026-08-25
(Cristian's own request): "Lead" reads "Registro", "Revenue" reads
"Ingresos", "Visitor → Lead" reads "Visitante → Registro", etc.
throughout every `/admin/*` page — see docs/COMMAND_CENTER.md.

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

## Per-route metrics (Landings section, not part of the Overview object)

| KPI | Definition |
|---|---|
| **Tiempo promedio (por ruta)** | For every `page_view`/`landing_view` on a route, the gap until that same visitor's next interaction (any route/event) — averaged per route. Excludes the last event of a session (no "next" event to measure against) and any gap over the 30-minute session threshold (a left-open tab, not real reading time). `null` — rendered as an em dash, never 0:00 — until at least one sample exists for that route. Computed by `getLandingPerformance()` (`src/server/analytics/engagement.ts`), added 2026-08-25 answering "cuánto tiempo pasa la gente en cada página" — no new tracking, derived entirely from `interaction.route`/`created_at`, already recorded since Block 02/03. |

## What's deliberately not defined yet

CAC, ROAS, CPA, CPL — the brief is explicit: don't calculate these
without real ad-spend data, which doesn't exist in this system (no ad
platform integration — see docs/ARCHITECTURE.md §11 and "Future
Publicidad" in the Block 03 brief). Adding them without real spend data
would produce numbers that look precise but mean nothing.
