# NEXT_BLOCK.md — what happens next, and why

## Block 08 is closed. Next up: Block 09 or Block 10 (Cristian's call)

Both are ready to start technically — neither is blocked on the other.
Recommended default order (per `docs/MASTER_ROADMAP.md`): **Block 09
(productos físicos — real fulfillment)** first, since `/productos`
already has a live WhatsApp/lead-capture MVP to build on top of, versus
Block 10 (automations) which needs a lifecycle map designed from
scratch first.

## Before either can *close* (not start — start is unblocked)

- **Block 09** needs Decision Gate 4 answered: Droppy API (real
  integration, needs credentials/docs) vs. explicit manual fulfillment
  MVP (recommended — matches the brief's own "pocos productos →
  validación → escalar ganadores").
- **Block 10** needs the lifecycle map designed first, *then* Decision
  Gate 5 (email/WhatsApp vendor) — never choose the vendor before the
  map, per the brief's own instruction.
- **Música's real activation** (not a new block on its own — folds into
  whichever block touches `entitlement` next) needs: the song's own
  title/artwork (a content decision, not technical) + Decision Gate 3
  (payment provider) before `grantEntitlement()` gets a real caller.

## Open Decision Gates

3. Payment provider for música/productos digitales — blocks a real
   `entitlement` writer.
4. Droppy API vs. manual fulfillment — blocks Block 09's real close.
5. Email/WhatsApp automation vendor — deliberately deferred until the
   Block 10 lifecycle map exists.

## What NOT to rebuild when either block starts

CRM, Analytics, Commerce (`CheckoutLink`/`resolveCheckoutDestination()`/
`/api/checkout/[offerSlug]`), `GoLink`/`TrackedLink`, the `entitlement`
table (reuse it, don't build a second access mechanism), `b2b_opportunity`.
All confirmed solid and reusable as of Block 08's close.
