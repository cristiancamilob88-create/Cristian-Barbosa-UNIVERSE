# ANALYTICS.md — event taxonomy

Two related taxonomies now exist, deliberately kept distinct:

- **`AnalyticsEvent`** (`src/lib/analytics.ts`) — what client code can
  call `track()` with.
- **`interaction.event_name`** (`INTERACTION_EVENT_NAMES`,
  `src/server/db/repositories/interaction.ts`, mirrored by a DB CHECK
  constraint) — what actually gets persisted to the database. The two
  overlap but aren't 1:1: `whatsapp_click`/`social_click` are
  DB-taxonomy-only (recorded server-side by `/go/[slug]`, never fired
  from client `track()` — see docs/SOCIAL_ROUTING.md), and several
  `interaction` event names (`landing_view`, `event_registration`,
  `checkout_started`, `purchase`, `subscription_started`,
  `subscription_cancelled`) are reserved for later blocks with no writer
  yet.

Every event exists because it answers one specific, actionable question
from the brief's Analytics/Dashboard sections — this list is deliberately
not "everything that's easy to measure."

| Event | Fired from | Persisted? | Question it answers |
|---|---|---|---|
| `page_view` | (reserved) | No | Which pillars get discovered? |
| `landing_view` | (reserved) | No — DB taxonomy only | Which attributed landing converts to a real visit? |
| `cta_click` | `TrackedLink`, any commercial-intent internal link | **Yes**, via `/api/track` | Which specific CTA gets clicked, on which topic? |
| `whatsapp_click` | `GoLink` → `/go/[slug]` (platform = whatsapp) | **Yes**, server-side, no client call | Is WhatsApp actually converting community interest? |
| `social_click` | `GoLink` → `/go/[slug]` (any other platform) | **Yes**, server-side, no client call | Which outbound network gets used, from which page/campaign? |
| `lead_submit` | `ContactForm`, on a successful `/api/lead` response | Console only — `/api/lead` already records `lead_submitted` server-side in the same request; forwarding this too would double-count | Hook point for a future vendor pixel. |
| `interest_selected` | (reserved) | No | A future multi-step form could fire this before a full lead. |
| `checkout_started` / `purchase` / `subscription_started` / `subscription_cancelled` | (reserved for Block 04 — commerce) | No | Funnel drop-off, revenue by product, subscription lifecycle. |
| `event_registration` | (reserved) | No | An events RSVP flow, not built yet. |

## Why a `track()` abstraction instead of a vendor SDK directly

No analytics vendor is chosen yet (Product Vision explicitly says not to
invent one). Every call site uses `track(event)`; adding a real sink
later means implementing `AnalyticsSink` once in `registerAnalyticsSink()`
— no page changes. As of Block 02, one sink already exists beyond
console.debug: a `fetch('/api/track', { keepalive: true })` call for
`cta_click` specifically (see the comment in `src/lib/analytics.ts` for
exactly why only that event forwards, and why `keepalive` matters — the
click that fires it often immediately navigates away).

## What Block 02 actually persists, and how to query it

Every persisted event lands in the single `interaction` table (see
docs/DATA_MODEL.md, "INTERACTION vs. JOURNEY_EVENT"), with the
attribution that applied *at the moment it fired* attached
(`source_id`/`campaign_id`/`qr_id`) — not just the event name. This is
what makes acquisition-to-conversion questions answerable as a query
instead of a guess; see docs/AUDIENCE_JOURNEY.md for a worked example.

## Still not built in this block

- No real analytics vendor wired (GA4/Meta Pixel/PostHog/etc.) — only
  this app's own `interaction` table.
- No `page_view` persistence — high-volume and better served by a real
  analytics warehouse later (Block 03) than by writing a row on every
  navigation.
- No dashboard UI — this taxonomy, now backed by real data, is what a
  future dashboard block reads.
