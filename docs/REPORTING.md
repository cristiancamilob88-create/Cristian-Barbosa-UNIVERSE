# REPORTING.md — the `/api/analytics/*` surface

Read-only, private (docs/SECURITY.md, "Analytics endpoint authorization").
As of Block 04, the Command Center dashboard (docs/COMMAND_CENTER.md) is
these routes' real consumer — every `/admin/*` section page fetches one
of these, nothing else. Every route: `resolveAnalyticsRequest()`
(`src/server/analytics/http.ts`) checks the credential, then parses
`?range=`/`?from=&to=` (docs/ANALYTICS_ENGINE.md, "Date ranges") — both in
one call, so each route file is just "resolve, query, respond".

Two accepted credentials, checked in this order (docs/COMMAND_CENTER.md,
"Authentication model"):

1. The `cb_admin_session` cookie (httpOnly, set by `/admin/login`) — what
   the browser sends automatically once logged in. This is the
   dashboard's own path; it never handles a bearer token.
2. `Authorization: Bearer <ANALYTICS_API_TOKEN>` — kept for a future
   service-to-service/automation caller that isn't a logged-in browser.

## `GET /api/analytics/overview`

The KPI summary (docs/KPI_DEFINITIONS.md) plus read models with no
endpoint of their own: leads by interest, social/outbound performance,
and (Block 04.1) the daily time series behind the Command Center's
"evolución temporal" sparklines.

```json
{
  "ok": true,
  "range": { "from": "...", "to": "..." },
  "data": { "visitors": 0, "sessions": 0, "...": "...", "ratios": { "...": null } },
  "leadsByInterest": [{ "key": "...", "label": "training", "leads": 0 }],
  "social": [{ "platform": "instagram", "slug": "instagram-main", "clicks": 0, "uniqueVisitors": 0 }],
  "timeseries": [{ "date": "2026-08-01", "visitors": 0, "leads": 0, "purchases": 0, "revenueCents": 0 }]
}
```

## `GET /api/analytics/sources` / `GET /api/analytics/campaigns` / `GET /api/analytics/medium`

Read models 1–2 + "SOURCE/CAMPAIGN/MEDIUM PERFORMANCE": one row per
source/campaign/medium — `getPerformanceByDimension()`
(`src/server/analytics/performance.ts`). `medium` (Block 04.1) is free
text (e.g. `social`, `qr`, `referral`), not a dictionary id — its `key`
and `label` are the same raw string.

```json
{ "ok": true, "range": {"...": "..."}, "data": [
  { "key": "<uuid>", "label": "Instagram", "visitors": 0, "leads": 0, "purchases": 0,
    "revenueCents": 0, "visitorToLeadRate": null, "leadToPurchaseRate": null }
]}
```

`key: null` (`label: "direct"`) is the no-attribution bucket. `visitors`
is **acquisition** here (first-touch in range) — not the same
"Visitors" as the overview KPI (docs/KPI_DEFINITIONS.md).

## `GET /api/analytics/qr`

Read model 3 + "QR PERFORMANCE" — the brief's own worked example shape
(scans → landing views → CTA/WhatsApp clicks → leads → purchases →
revenue), one row per registered `qr_source`
(`src/server/analytics/qr.ts`).

```json
{ "data": [
  { "qrSlug": "aura-2026-main", "destinationPath": "/entrenar", "active": true,
    "visits": 0, "landingViews": 0, "ctaClicks": 0, "whatsappClicks": 0,
    "leads": 0, "purchases": 0, "revenueCents": 0 }
]}
```

## `GET /api/analytics/landings`

Read models 5–7 + "LANDING PERFORMANCE": per-route views, unique
visitors, CTA clicks, lead/purchase conversion
(`getLandingPerformance()`, `src/server/analytics/engagement.ts`).
Conversion is attributed to `contact.first_touch_landing_path` (docs/CRM.md).

## `GET /api/analytics/products`

Product/offer views (reserved — Block 04, docs/ANALYTICS_ENGINE.md) plus
revenue by product/offer.

```json
{ "data": {
  "views": [{ "productSlug": "digital-course", "productName": "Curso digital", "views": 0, "uniqueVisitors": 0 }],
  "revenue": [{ "productSlug": "digital-course", "productName": "Curso digital", "offerSlug": "digital-course-standard", "purchases": 0, "revenueCents": 0 }]
}}
```

## `GET /api/analytics/funnel`

Read model 20 (funnel conversion rate). `?preset=acquisition-to-purchase`
(default) or `?preset=training-to-lead`, or a fully custom
`?steps=visit,landing_view,cta_click,lead_submitted` (any taxonomy event
name, plus the special `visit`). See docs/ANALYTICS_ENGINE.md, "Funnels".

```json
{ "data": [
  { "name": "Visit", "event": "visit", "visitors": 0, "conversionFromPrevious": null, "conversionFromFirst": null },
  { "name": "Landing view", "event": "landing_view", "visitors": 0, "conversionFromPrevious": 0, "conversionFromFirst": null }
]}
```

## `GET /api/analytics/revenue`

Read models 15–19: total, by source/campaign/QR (`?attribution=first_touch`
default, or `last_touch` — docs/ANALYTICS_ENGINE.md/docs/CRM.md), by
product/offer.

```json
{ "attribution": "first_touch", "data": {
  "total": { "purchases": 0, "revenueCents": 0 },
  "bySource": [{ "key": "<uuid>", "label": "Instagram", "purchases": 0, "revenueCents": 0 }],
  "byCampaign": ["..."],
  "byQr": ["..."],
  "byProductAndOffer": [{ "productSlug": "...", "productName": "...", "offerSlug": "...", "purchases": 0, "revenueCents": 0 }],
  "customers": { "total": 0 }
}}
```

`customers.total` (Block 05) is distinct paying contacts in range — see
`getCustomerSummary()`, docs/COMMERCE.md.

## `GET /api/analytics/subscriptions`

Block 05 — the one endpoint reading `subscription`
(`getSubscriptionSummary()`, `src/server/analytics/commerce.ts`).
`active`/`paused`/`cancelled` are current totals, not range-filtered;
`startedInRange`/`cancelledInRange` are.

```json
{ "ok": true, "range": {"...": "..."}, "data": {
  "active": 0, "paused": 0, "cancelled": 0, "startedInRange": 0, "cancelledInRange": 0
}}
```

## `GET /api/analytics/leads`

Block 04.1 — the individual-lead activity list behind the Command
Center's Leads section (`getRecentLeads()`,
`src/server/analytics/leads.ts`). Most recent first, capped at 25 by
default. No PII (no `contact_id`, name, or email) — see the read
model's own doc comment and docs/ANALYTICS_ENGINE.md, "Recent-leads list".

```json
{ "ok": true, "range": {"...": "..."}, "data": [
  { "id": "<uuid>", "topicRaw": "entrenar", "status": "new",
    "interestLabel": "Entrenamiento", "sourceLabel": "Instagram",
    "campaignLabel": "aura-2026", "qrSlug": null, "medium": "social",
    "createdAt": "2026-08-22T18:04:00.000Z" }
]}
```

## Errors

| Status | When |
|---|---|
| `503` | Neither `ANALYTICS_API_TOKEN` nor `ADMIN_SESSION_SECRET` is configured server-side — fails closed, never open. |
| `401` | No valid session cookie and no/wrong bearer token. |
| `400` | Unknown `range`/`preset`, invalid `from`/`to`, or an unknown funnel `steps` event name. |

## What's not built yet

No pagination (result sets are small at current scale —
dictionary-sized, not row-count-of-`interaction`-sized). No caching
layer (every request re-queries Postgres directly; add one if dashboard
polling frequency ever makes that a real cost). No dedicated
`/api/analytics/social` route — `GET /api/analytics/overview`'s `social`
field is the one consumer (`/admin/social`) uses; see
docs/COMMAND_CENTER.md, "Endpoints used, and why not more".
