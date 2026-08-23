# NEXT_BLOCK.md — what happens next, and why

## Immediate next step

**Wait for Cristian on Decision Gates 1–2** (Block 07's own report,
`docs/MASTER_BRIEF_BLOCK_07_10.md` Decision Gate format), then:

1. If Decision Gate 1 (Facebook Subscription URL) resolves: update
   `social_profile.url` for the `facebook-subscription` slug (one row,
   no migration) on both local seed and the real Supabase project.
2. If Decision Gate 2 (price/provider) resolves for any offer: set
   `price_cents`/`checkout_provider`/`checkout_url` on the corresponding
   `offer` row(s) — `resolveCheckoutDestination()` and
   `/api/checkout/[offerSlug]` need no code change, per docs/COMMERCE.md.
3. If Cristian instead says "stay in quote mode for now" — Block 07 can
   close on that basis: the funnel is real end to end up to lead
   capture, which is itself the brief's second acceptable path
   (`TRÁFICO → INTERÉS → REGISTRO → SEGMENTACIÓN → LIFECYCLE MARKETING`).
   That's a valid, honest checkpoint close, not a failure to reach one.

Either way, run the local test suite again, apply the Block 07 seed
additions (coaching offers) to the real Supabase project (data-only,
already reviewed — see docs/SUPABASE_PRODUCTION.md for the read-only-
audit discipline that applies to any future write there too), and
deliver Block 07's own STATUS report before touching Block 08.

## Why Block 08 shouldn't start yet

Its "access after confirmed payment" mechanism needs Decision Gate 3
(payment provider) settled first — building it against a guess would
risk exactly the rework `docs/MASTER_BRIEF_BLOCK_07_10.md`'s point K
warns about. The read models, Commerce abstraction, and CRM it will
reuse are already confirmed ready (Block 07.1 audit).

## Open Decision Gates (full text in the Block 07.1 audit — chat
history / this checkpoint's report)

1. Facebook Subscription real URL.
2. At least one real price + checkout provider, or explicit "stay in
   quote mode."
3. Payment provider for music/digital products (Block 08).
4. Droppy vs. manual fulfillment (Block 09).
5. Email/WhatsApp vendor (Block 10) — deliberately not asked yet.

## Recommended order once Gate 1/2 answers arrive

Close Block 07 (real sale or confirmed quote-mode close) → design the
Block 08 access/delivery migration with Gate 3's answer → Block 08
implementation → Block 09 (once Gate 4 answered, can run in parallel
with Block 08 if Cristian wants both moving) → Block 10 lifecycle map.
