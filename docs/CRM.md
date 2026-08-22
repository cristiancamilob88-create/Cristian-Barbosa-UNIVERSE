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
   already on file.
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

`/entrenar` links to specific coaching tiers
(`?topic=coaching-essential`, `-performance`, `-elite`) that all resolve
to the single canonical interest `coaching` (see
`src/app/contacto/page.tsx`'s `TOPIC_ALIASES`) — the form itself only
ever offers one "Coaching personalizado" option. `lead.topic_raw` keeps
the more specific original string (which tier they actually clicked
through from) without needing a canonical `coaching_essential` /
`coaching_performance` / `coaching_elite` interest that would only ever
be used by this one form. If a future block needs tier-level interest
tracking, that's a real product decision to make deliberately, not one
to bake in speculatively now.

## Deduplication

Documented in docs/DATABASE.md's guardrails section and enforced by
partial unique indexes, not just application code: `contact.email`
(case-insensitive via `citext`) and `contact.phone` are each unique where
not null. `findOrCreateContact()` checks email first, then phone — no
fuzzy name matching, which would risk merging two different people who
happen to share a name.

## B2B pipeline (`b2b_opportunity`)

Not wired to any UI in this block (no form creates one yet — `/shows` and
`/marcas` still route to the general `/contacto` lead form). The table
and its `lead → qualified → proposal → negotiation → won/lost` stage
vocabulary exist so the next block that builds a real B2B intake (or an
internal pipeline view) has a reviewed schema instead of inventing one
under time pressure — the same reasoning as `types/crm.ts` in Block 01.

## What's still just a catalog, not commerce

`product`/`offer` are populated (seed.sql has five products, two offers)
but nothing in the app creates an `orders` row yet — there is no checkout.
`offer.price_cents` is nullable specifically because final commercial
pricing is an explicit non-goal of this block (see Product Vision).
