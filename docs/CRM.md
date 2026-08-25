# CRM.md — CRM implementation

## The /api/lead flow

`src/app/api/lead/route.ts`, step by step (matches the brief's 10-step
list exactly):

1. **Rate limit** — in-memory sliding window, 5 requests/minute/IP (see
   docs/SECURITY.md for the documented limitation).
2. **Validate** — zod (`leadSchema`); invalid input never reaches
   application logic, 400 with issue detail.
3. **Honeypot** — a non-empty `company` field returns a fake `{ok:true}`
   and writes nothing. (Bounded at the schema level, not rejected there —
   see the comment on `leadSchema.company` for why `max(0)` would have
   been a bug: it would 400 a tripped honeypot instead of silently
   dropping it, telling a bot exactly which field to leave empty.)
4. **Resolve attribution** — `resolveVisitorContext()` (docs/ATTRIBUTION.md).
5. **Find or create contact** — `findOrCreateContact()`
   (`src/server/db/repositories/contact.ts`): matches on email
   (case-insensitive), then phone. First-touch copied once on creation;
   last-touch refreshed on every match. Name is filled in only if
   previously null — a later, blanker submission never erases a name
   already on file. **Phone is a required field on `ContactForm`**
   (2026-08-25, Cristian's own ask — WhatsApp is this site's real
   follow-up channel throughout) — before this, `contact.phone` existed
   in the schema and in this function's own matching logic but no form
   ever collected it, so it was always null in practice.
6. **Link visitor → contact** — `linkVisitorToContact()`, backfilling
   prior anonymous interactions (docs/AUDIENCE_JOURNEY.md).
7. **Assign interest** — the form's `topic` maps to the canonical
   `interest` dictionary via `TOPIC_TO_INTEREST_SLUG` in the route file
   (`entrenar→training`, `coaching→coaching`, `shows→shows`,
   `marcas→brands`, `musica→music`, `productos→products`,
   `general→` no interest). Unmapped/unresolved topics still create the
   lead — an interest is attached "if available", never required.
8. **Create lead** — `createLead()`, storing both `interest_id` (nullable)
   and `topic_raw` (the literal string submitted, e.g.
   `coaching-elite` — see below) verbatim.
9. **Record `lead_submitted`** — one `interaction` row, in the same
   transaction as everything above.
10. **Respond** — `{ ok: true }`, nothing from the database is ever
    echoed back.

All nine writes (visitor upsert, contact, contact_visitor,
contact_interest, lead, interaction) happen inside one
`withTransaction()` — a failure partway through rolls back the whole
request instead of leaving a contact with no lead or a lead with no
interaction.

## Topic vs. interest: why both exist on `lead`

**Updated in Block 07** (docs/MASTER_BRIEF_BLOCK_07_10.md): coaching no
longer routes through `/contacto` at all — the three tiers close over
WhatsApp comercial directly (`src/app/entrenar/page.tsx`), so the old
`coaching-essential`/`-performance`/`-elite` topic aliases in
`src/app/contacto/page.tsx` were dead code and were removed. `topic` is
still deliberately coarser than every possible CTA a visitor could have
clicked — `lead.topic_raw` (free text, always populated) records
exactly what the visitor submitted, `lead.interest_id` (nullable FK)
maps it to the canonical, coarser `interest` dictionary. Block 07 added
the one real split this coarseness was hiding: `productos` used to map
every physical *and* digital inquiry to the same `products` interest;
`productos_fisicos`/`productos_digitales` (`src/app/api/lead/route.ts`)
now map to the `physical_products`/`digital_products` interests that
existed, unused, since Block 02.

## Deduplication

Documented in docs/DATABASE.md's guardrails section and enforced by
partial unique indexes, not just application code: `contact.email`
(case-insensitive via `citext`) and `contact.phone` are each unique where
not null. `findOrCreateContact()` checks email first, then phone — no
fuzzy name matching, which would risk merging two different people who
happen to share a name.

## B2B pipeline (`b2b_opportunity`)

**Real writer since Block 07.1** (`src/server/db/repositories/b2bOpportunity.ts`):
`/shows` and `/marcas` still route to the general `/contacto` lead form
(same `/api/lead` pipeline as every other topic — no second form was
built), but when the submitted topic is `shows`/`marcas`, `/api/lead`
now also opens a `b2b_opportunity` row alongside the generic `lead` —
`category` (`shows`/`brands`), `stage` defaulting to `lead`,
`estimated_value_cents` staying null (a contact-form submission never
implies a deal size). The `lead → qualified → proposal → negotiation →
won/lost` stage vocabulary is real and usable now, just not yet
surfaced anywhere in the Command Center — a pipeline view is a natural
next step, not built in Block 07.

## What's still just a catalog, not full commerce

`product`/`offer` are populated (seed.sql has eight products, six
offers). **Facebook Subscription has a real price, provider, and
checkout URL as of Block 07** (`facebook-subscription-standard`,
29.900 COP/mes, `checkout_provider: 'manual'`, `purchase_type:
'recurring'`) and is the first offer this app has ever redirected a
real visitor to — `checkout_started` is a real, attributed event now,
not just reserved taxonomy. `orders`/`subscription` still have no
writer: Facebook's own checkout doesn't confirm back to this app (no
Meta API integration — docs/MASTER_BRIEF_BLOCK_07_10.md, "07.SEC"), so
a purchase there is observable as a `checkout_started` click, not yet
as a confirmed `orders`/`subscription` row. Coaching's three tiers also
have real prices now but stay `purchase_type: 'quote'` on purpose —
they close over WhatsApp with a human, not a checkout.
