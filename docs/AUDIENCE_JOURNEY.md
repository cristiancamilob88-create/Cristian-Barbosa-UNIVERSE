# AUDIENCE_JOURNEY.md — the data foundation, not the dashboard

This block builds the model the brief's chain describes:

```
VISITOR → SESSION → SOURCE → PAGE → INTERACTION → INTEREST → LEAD → OFFER → CONVERSION → REVENUE
```

No visual journey UI exists yet (explicitly out of scope — see
docs/ARCHITECTURE.md §11). What follows is how each link in that chain
maps to a real table/column or read-model query, and a worked example
proving the chain actually reconstructs.

## The mapping

| Brief concept | This schema |
|---|---|
| VISITOR | `visitor` row, keyed by the `cb_visitor` cookie. |
| SESSION | Not a stored table — computed on read by gap-sessionizing `interaction` (30-min threshold), `getSessionSummary()` (`src/server/analytics/sessions.ts`, Block 03). Every question the brief asks about sessions is answerable from `interaction` alone; a stored table would just duplicate it. |
| SOURCE | `interaction.source_id`/`campaign_id`/`qr_id` **+ `medium`/`content`/`term`/`referrer`** (Block 03) — the attribution snapshot *at the moment that event fired*, not just the visitor's current state. |
| PAGE | `interaction.route`. |
| INTERACTION | `interaction.event_name` + `metadata` (+ `entity_type`/`entity_id` for entity-specific events like `product_view` — Block 03). |
| INTEREST | `contact_interest`, once the visitor is identified. |
| LEAD | `lead`, linked to the same `contact`. |
| OFFER | `offer` (catalog only — no checkout in this block). |
| CONVERSION / REVENUE | `orders`/`order_items`/`subscription` (schema only, no writes yet — Block 04). Revenue read models exist and are tested against simulated purchase data — see docs/ANALYTICS_ENGINE.md and docs/CRM.md. |

## Worked example: the brief's own scenario

> User arrived through Aura QR. User viewed /entrenar. User clicked
> Facebook. User entered WhatsApp. User submitted lead. User later
> purchased a course.

Traced through this schema:

1. **QR scan** → `GET /entrenar?utm_source=aura&utm_medium=qr&utm_campaign=aura-2026&qr=aura-2026-main`.
   `src/proxy.ts` sets `cb_visitor` (new) + `cb_attr_first`/`cb_attr_last`
   (both — this is the first touch).
2. **Page view** — persisted as `landing_view` (the URL still carries the
   Aura QR signal at this point) by `PageViewTracker` → `/api/track`
   (Block 03 — see docs/ANALYTICS.md).
3. **Clicks Facebook** → `GET /go/facebook-subscription`. Writes one
   `interaction` (`event_name: social_click`, `route: /go/facebook-subscription`,
   `source_id`/`campaign_id` resolved from the *still-current* last-touch
   — still the Aura QR touch, since nothing has re-attributed since).
   `visitor_id` set, `contact_id` still null (not identified yet).
4. **"Enters WhatsApp"** → if that's `/go/whatsapp-community`, another
   `interaction` row (`event_name: whatsapp_click`), same visitor,
   still-anonymous.
5. **Submits a lead** → `POST /api/lead`. Inside one transaction:
   `findOrCreateContact` creates a `contact`, copying the visitor's
   first-touch (Aura QR) as the contact's permanent first-touch.
   `linkVisitorToContact` backfills steps 3–4's `interaction` rows with
   the new `contact_id` — retroactively, without touching what those
   events *were*. A `lead_submitted` interaction is recorded with
   `contact_id` already set.
6. **Later purchases a course** — not implemented in this block
   (Block 04: an `orders` row would reference the same `contact_id`,
   letting a query join all the way back to `aura-2026` as the
   originating campaign for that revenue).

Querying "everything this person did, in order, with what was known
about acquisition at each step" is now a formalized function,
`getContactJourney()` (`src/server/analytics/journey.ts`, Block 03) —
conceptually:

```sql
select event_name, route, source_id, campaign_id, medium, content, created_at
from interaction
where contact_id = $1
order by created_at;
```

— which returns steps 3–5 above with the QR campaign attached to every
row, because that attribution was captured at write time, not derived
after the fact.

## Why this isn't premature

Every table this relies on has integration test coverage proving the
specific mechanic works: visitor upsert, first-touch immutability (both
application-level and a DB trigger), the backfill on identification,
end-to-end lead creation (`src/server/db/repositories/*.integration.test.ts`,
`src/app/**/*.integration.test.ts`) — and, as of Block 03, the exact
scenario above (and five others) run as automated tests in
`src/server/analytics/journeys.integration.test.ts`, using the real
`/api/lead` route handler for the lead-submission step, not a mock. This
is a verified foundation, not an aspirational one.
