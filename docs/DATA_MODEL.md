# DATA_MODEL.md — CRM entity rationale

`src/types/crm.ts` defines the entities below as **TypeScript types only**
— there is no database yet (see ARCHITECTURE.md §4). This document is the
rationale a future data-layer block turns into real tables, so that block
starts from a reviewed contract instead of inventing one under time
pressure.

## Why these entities and no others

The brief listed: CONTACT, SOURCE, CAMPAIGN, INTEREST, LEAD, PRODUCT,
ORDER, SUBSCRIPTION, EVENT, INTERACTION. All ten are kept — each maps to a
real, distinct query the business needs to answer:

| Entity | Answers |
|---|---|
| `Contact` | Who is this person, across every channel they've used? |
| `SourceRef` | Where did this specific touch come from? |
| `Campaign` | Which named effort (a show, a QR sticker run) is this touch part of? |
| `Interest` | Which parts of the universe has this person shown interest in? |
| `Lead` | Is there an open ask from this person that needs a reply? |
| `Product` | What can be sold, and through which system? |
| `Order` | What did they buy, once? |
| `Subscription` | What are they paying for on an ongoing basis? |
| `EventEntity` | What live/physical touchpoint (show, QR location) generated activity? |
| `Interaction` | The append-only journal every other read model is derived from. |

`SourceRef` is **embedded** in `Contact` (as `firstSource`/`lastSource`)
and in `Interaction`, not a separate top-level table with its own id —
it's written once alongside its owner and never queried independently of
it. That keeps the model at nine real tables instead of ten, without
losing any information the brief asked for.

## Key relationships

- One `Contact` → many `Interaction`, `Interest`, `Lead`, `Order`,
  `Subscription`. This is the "una persona puede tener múltiples fuentes,
  intereses, compras..." requirement — modeled as one-to-many from
  `Contact`, not a wide table with repeated columns.
- `Lead.topic` and `Interest.topic` use the same vocabulary as the route
  pillars (`entrenar`, `musica`, `shows-b2b`, ...) so a lead or interest
  can be attributed to the page that generated it without a lookup table.
- `Campaign.slug` is designed to equal the `utm_campaign` value used in
  real URLs/QR codes (e.g. `aura-envigado`), so campaign rollup is a
  string match, not a manual mapping step.

## Storage recommendation

Postgres (via Supabase, per ARCHITECTURE.md §4) once a data-layer block is
authorized:

- Every relationship above is a foreign key, not a document reference —
  a relational store avoids re-implementing joins in application code.
- Row Level Security can scope a future authenticated area (member
  portal, coaching dashboard) to a contact's own rows without a bespoke
  authorization layer.
- `Interaction` as an append-only journal fits Postgres well (insert-only,
  indexed by `contactId` + `createdAt`); read models like "leads this
  week" or "active subscriptions" become materialized views or plain
  queries over it rather than separate mutable tables to keep in sync.

## Explicitly not modeled yet

- No `User`/auth table — nothing in this block requires login.
- No payment-provider-specific fields on `Order`/`Subscription` — the
  brief says not to couple to one checkout provider yet (ARCHITECTURE.md
  §4, Roadmap Block 04).
- No campaign budget/spend fields on `Campaign` — nothing in the brief
  asked for ad-spend ROI yet; add it when Dashboard's "B2B pipeline
  value" work actually starts.
