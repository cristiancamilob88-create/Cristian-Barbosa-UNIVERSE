# AUDIENCE_JOURNEY.md — the data foundation, not the dashboard

This block builds the model the brief's chain describes:

```
VISITOR → SESSION → SOURCE → PAGE → INTERACTION → INTEREST → LEAD → OFFER → CONVERSION → REVENUE
```

No visual journey UI exists yet (explicitly out of scope — see
docs/ARCHITECTURE.md §11). What follows is how each link in that chain
maps to a real table/column, and a worked example proving the chain
actually reconstructs.

## The mapping

| Brief concept | This schema |
|---|---|
| VISITOR | `visitor` row, keyed by the `cb_visitor` cookie. |
| SESSION | Not a separate table — a session is implicit in `interaction.created_at` proximity per `visitor_id`. Adding a real `session` table (start/end, duration) is a Block 03 candidate once there's a dashboard that needs session-level rollups; nothing in this block reads or writes one, so it isn't built (avoid unnecessary tables). |
| SOURCE | `interaction.source_id`/`campaign_id`/`qr_id` — the attribution snapshot *at the moment that event fired*, not just the visitor's current state. |
| PAGE | `interaction.route`. |
| INTERACTION | `interaction.event_name` + `metadata`. |
| INTEREST | `contact_interest`, once the visitor is identified. |
| LEAD | `lead`, linked to the same `contact`. |
| OFFER | `offer` (catalog only — no checkout in this block). |
| CONVERSION / REVENUE | `orders`/`order_items`/`subscription` (schema only, no writes yet — Block 04). |

## Worked example: the brief's own scenario

> User arrived through Aura QR. User viewed /entrenar. User clicked
> Facebook. User entered WhatsApp. User submitted lead. User later
> purchased a course.

Traced through this schema:

1. **QR scan** → `GET /entrenar?utm_source=aura&utm_medium=qr&utm_campaign=aura-2026&qr=aura-2026-main`.
   `src/proxy.ts` sets `cb_visitor` (new) + `cb_attr_first`/`cb_attr_last`
   (both — this is the first touch).
2. **Page view** (not persisted to DB in this block — see
   docs/ANALYTICS.md for why `page_view` stays console-only for now).
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
about acquisition at each step" is:

```sql
select event_name, route, source_id, campaign_id, created_at
from interaction
where contact_id = $1
order by created_at;
```

— which returns steps 3–5 above with the QR campaign attached to every
row, because that attribution was captured at write time, not derived
after the fact.

## Why this isn't premature

Every table this relies on already has integration test coverage proving
the specific mechanic works (see `src/server/db/repositories/*.integration.test.ts`
and `src/app/**/*.integration.test.ts`): visitor upsert, first-touch
immutability (both application-level and a DB trigger), the backfill on
identification, and end-to-end lead creation. This is a verified
foundation, not an aspirational one.
