# DATA_MODEL.md — CRM entity rationale

Block 01 defined these entities as TypeScript types only, with no
database behind them. **Block 02 turned them into the real Postgres
schema in `supabase/migrations/0001_init_schema.sql`**, and **Block 03
extended `interaction` for analytics** (`0003_analytics_engine.sql` —
see docs/ANALYTICS_ENGINE.md, "Canonical event schema") — this document
records the rationale for that literal schema (see docs/DATABASE.md for
the column-by-column reference, and docs/CRM.md for how the write path
actually uses it). `src/types/crm.ts` still holds the application-facing
convenience types for code that shouldn't import `pg`.

## Why these entities and no others

The Block 02 brief listed: CONTACT, SOURCE, CAMPAIGN, QR_SOURCE, INTEREST,
CONTACT_INTEREST, INTERACTION, JOURNEY_EVENT, PRODUCT, OFFER, LEAD, ORDER,
ORDER_ITEM, SUBSCRIPTION, B2B_OPPORTUNITY, SOCIAL_PROFILE — plus VISITOR
and CONTACT_VISITOR, which the brief's own "must allow events to be
associated with the same person when the visitor becomes identifiable"
requirement implies but doesn't name outright.

| Entity | Table | Answers |
|---|---|---|
| Contact | `contact` | Who is this person, across every channel they've used? |
| Visitor | `visitor` | Who is this *before* we know who they are? |
| Contact ↔ Visitor | `contact_visitor` | Which anonymous session(s) turned out to be this person? |
| Source | `source` | Where did this specific touch come from? |
| Campaign | `campaign` | Which named effort is this touch part of? |
| Qr Source | `qr_source` | Which registered physical/printed code was scanned? |
| Social Profile | `social_profile` | Which real channel/account does an outbound link point at? |
| Interest | `interest` | Which parts of the universe has this person shown interest in? |
| Contact ↔ Interest | `contact_interest` | — |
| Lead | `lead` | Is there an open ask from this person that needs a reply? |
| Product | `product` | What can be sold, and through which system? |
| Offer | `offer` | On what terms — this time, at this price, for this campaign? |
| Orders / Order Items | `orders` / `order_items` | What did they buy, once? (`order` is a reserved SQL keyword — named plural.) |
| Subscription | `subscription` | What are they paying for on an ongoing basis? |
| B2B Opportunity | `b2b_opportunity` | A lightweight pipeline for shows/brands/sponsors. |
| Interaction | `interaction` | The single append-only journal every other read model derives from. |

## The INTERACTION vs. JOURNEY_EVENT decision

The Block 02 brief explicitly asked this to be evaluated rather than
assumed: **unified into one table, `interaction`.** Both concepts were
the same shape — something happened, tied to a visitor and optionally a
contact, at a point in time, with a type and some detail. A second table
would have meant every journey query joins two near-identical tables for
no new information, and kept two places to remember to write to instead
of one. See docs/AUDIENCE_JOURNEY.md for how the unified table still
answers every step of the brief's `VISITOR → SESSION → SOURCE → PAGE →
INTERACTION → INTEREST → LEAD → OFFER → CONVERSION → REVENUE` chain.

`EventEntity` from Block 01 (a show, a QR scan location, a school visit)
was retired for the same reason: it's fully covered by `campaign` +
`qr_source` and would have been a third overlapping table.

## `SourceRef` embedding, and why it grew a `qr` field

`SourceRef` (`src/types/crm.ts`) is embedded — as 8 flat columns × 2
(first-touch, last-touch) — on both `visitor` and `contact`, and once
(as a single attribution snapshot) on `interaction` and `lead`. It's
written once alongside its owner and never queried independently of it,
so a separate top-level `source_ref` table would only add a join with no
benefit. Block 02 added `qrSlug` to the shape, resolved to
`qr_source.id` alongside `source_id`/`campaign_id` — QR scans carry their
own identity distinct from the source/campaign they're configured for
(see docs/ATTRIBUTION.md).

## Key relationships

- One `contact` → many `interaction`, `interest` (via `contact_interest`),
  `lead`, and (schema-ready) `orders`/`subscription`. Modeled as
  one-to-many from `contact`, not a wide table with repeated columns —
  the "una persona puede tener múltiples fuentes, intereses, compras..."
  requirement.
- `source` and `campaign` are never FK'd to each other — a campaign can
  run across several sources at once (see docs/DATABASE.md's comment on
  the `campaign` table).
- `lead.topic_raw` (free text, always populated) and `lead.interest_id`
  (nullable FK into the canonical `interest` dictionary) intentionally
  both exist — see docs/CRM.md, "Topic vs. interest".
- `product` vs. `offer`: the same product can have several offers
  (different price, campaign, landing page) without duplicating the
  underlying catalog row.

## Storage: Postgres via Supabase — implemented

Per ARCHITECTURE.md §4, now real:

- Every relationship above is a genuine foreign key — see
  docs/DATABASE.md for cascade/set-null behavior per table.
- Row Level Security is enabled on every table
  (`supabase/migrations/0002_rls_policies.sql`) — see docs/SECURITY.md
  for what it actually guards today versus what it's prepared for.
- `interaction` is exactly the insert-only journal this section
  originally proposed, indexed by `(visitor_id, created_at)`,
  `(contact_id, created_at)`, and — as of Block 03 —
  `(entity_type, entity_id)` for entity-specific events and `(medium)`
  for medium-filtered rollups (docs/ANALYTICS_ENGINE.md).

## Explicitly not modeled yet

- No `User`/auth table, and therefore no `contact.auth_user_id` — nothing
  in this block requires login (see docs/SECURITY.md, "Deferred").
- No payment-provider-specific fields on `orders`/`subscription` — no
  checkout is wired yet (Block 04).
- No campaign budget/spend fields on `campaign` — nothing yet asks for
  ad-spend ROI; add it when Dashboard's "B2B pipeline value" work starts.
- No `session` table — see docs/AUDIENCE_JOURNEY.md for why a session is
  currently implicit rather than modeled.
