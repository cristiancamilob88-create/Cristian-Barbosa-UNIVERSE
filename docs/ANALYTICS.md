# ANALYTICS.md — event taxonomy

Two related taxonomies exist, deliberately kept distinct:

- **`AnalyticsEvent`** (`src/lib/analytics.ts`) — what client code can
  call `track()` with.
- **`interaction.event_name`** (`INTERACTION_EVENT_NAMES`,
  `src/server/db/repositories/interaction.ts`, mirrored by a DB CHECK
  constraint) — what actually gets persisted. The two overlap but aren't
  1:1: `whatsapp_click`/`social_click`/`outbound_click` are DB-taxonomy-only
  (recorded server-side by `/go/[slug]`, never fired from client
  `track()` — see docs/SOCIAL_ROUTING.md).

**Full event-by-event audit — including the Block 03 additions
(`contact_created`, `outbound_click`, `product_view`, `offer_view`) and
why `LEAD_CREATED` was rejected as a duplicate — lives in
docs/ANALYTICS_ENGINE.md**, which supersedes the table this doc used to
carry. Summary of what changed:

| Event | Persisted? |
|---|---|
| `page_view` | **Yes, as of Block 03** — see below. |
| `landing_view` | **Yes, as of Block 03.** |
| `cta_click` | Yes (since Block 02). |
| `whatsapp_click` / `social_click` / `outbound_click` | Yes, server-side via `/go/[slug]` (`outbound_click` is new — see docs/ANALYTICS_ENGINE.md). |
| `lead_submit` (client) / `lead_submitted` (DB) | `lead_submitted` yes, server-side; client `lead_submit` stays console-only (would double-count). |
| `contact_created` | Yes, new — fires only when `findOrCreateContact()` actually creates a row. |
| `interest_selected`, `product_view`, `offer_view`, `checkout_started`, `purchase`, `subscription_started`, `subscription_cancelled`, `event_registration` | Reserved, no writer yet. |

## `page_view`/`landing_view`: the Block 02 deferral, reversed

Block 02 deferred these as "high-volume, better served by a real
analytics warehouse later (Block 03)" — Block 03 is that later. They're
now fired by `PageViewTracker` (`src/components/analytics/PageViewTracker.tsx`,
mounted once in the root layout inside a `<Suspense>` boundary so it
doesn't force the rest of the app off static rendering) on every route
change: `landing_view` when the URL carries a fresh utm_*/qr signal
(mirrors `src/proxy.ts`'s own check), `page_view` otherwise.

## Why a `track()` abstraction instead of a vendor SDK directly

No analytics vendor is chosen yet (Product Vision explicitly says not to
invent one — still true in Block 03: "NO conectar todavía
permanentemente" any of GA4/Meta/TikTok/Ads/Mixpanel/PostHog). Every call
site uses `track(event)`; adding a real sink later means implementing
`AnalyticsSink` once in `registerAnalyticsSink()` — no page changes.
Persisted client events (`cta_click`, `page_view`, `landing_view`) go
through one `fetch('/api/track', { keepalive: true })` sink in
`src/lib/analytics.ts` — `keepalive` matters because the click/navigation
that fires these often immediately moves the page along.

## What gets persisted, and how to query it

Every persisted event lands in the single `interaction` table (see
docs/DATA_MODEL.md, "INTERACTION vs. JOURNEY_EVENT"), with the
attribution that applied *at the moment it fired* attached — as of Block
03, that's `source_id`/`campaign_id`/`qr_id` **and** `medium`/`content`/
`term`/`referrer` (previously resolved but discarded — see
docs/ANALYTICS_ENGINE.md, "Canonical event schema"). This is what makes
acquisition-to-conversion questions answerable as a query instead of a
guess; see docs/AUDIENCE_JOURNEY.md for a worked example, and
docs/REPORTING.md for the read-model API this now feeds.

## Still not built

- No real analytics vendor wired (GA4/Meta Pixel/PostHog/etc.) — only
  this app's own `interaction` table.
- No visual dashboard UI — docs/REPORTING.md's API is what a future
  dashboard block reads.
