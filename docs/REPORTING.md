# REPORTING.md — the `/api/analytics/*` surface

Read-only, private (docs/SECURITY.md, "Analytics endpoint authorization"),
JSON. No visual dashboard consumes these yet — this is the API a future
one is built against. Every route: `resolveAnalyticsRequest()`
(`src/server/analytics/http.ts`) checks the bearer token, then parses
`?range=`/`?from=&to=` (docs/ANALYTICS_ENGINE.md, "Date ranges") — both in
one call, so each route file is just "resolve, query, respond".

All requests: `Authorization: Bearer <ANALYTICS_API_TOKEN>`.

## `GET /api/analytics/overview`

The KPI summary (docs/KPI_DEFINITIONS.md) plus two read models with no
endpoint of their own: leads by interest, social/outbound performance.

```json
{
  "ok": true,
  "range": { "from": "...", "to": "..." },
  "data": { "visitors": 0, "sessions": 0, "...": "...", "ratios": { "...": null } },
  "leadsByInterest": [{ "key": "...", "label": "training", "leads": 0 }],
  "social": [{ "platform": "instagram", "slug": "instagram-main", "clicks": 0, "uniqueVisitors": 0 }]
}
```

## `GET /api/analytics/sources` / `GET /api/analytics/campaigns`

Read models 1–2 + "SOURCE/CAMPAIGN PERFORMANCE": one row per
source/campaign — `getPerformanceByDimension()`
(`src/server/analytics/performance.ts`).

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
  "byProductAndOffer": [{ "productSlug": "...", "productName": "...", "offerSlug": "...", "purchases": 0, "revenueCents": 0 }]
}}
```

## Errors

| Status | When |
|---|---|
| `503` | `ANALYTICS_API_TOKEN` isn't configured server-side — fails closed, never open. |
| `401` | Missing/wrong bearer token. |
| `400` | Unknown `range`/`preset`, invalid `from`/`to`, or an unknown funnel `steps` event name. |

## What's not built yet

No visual dashboard — this API is the intended data source for one, not
built in this block (explicit non-goal). No pagination (result sets are
small at current scale — dictionary-sized, not row-count-of-`interaction`-sized).
No caching layer (every request re-queries Postgres directly; add one if
dashboard polling frequency ever makes that a real cost).
