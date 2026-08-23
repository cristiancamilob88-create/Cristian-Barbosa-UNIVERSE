# MASTER_CHECKLIST.md — Blocks 07–10, itemized

Tracks every concrete item from `docs/MASTER_BRIEF_BLOCK_07_10.md`
against its real state. Updated at every checkpoint close. ✅ done,
🚧 partial, ⛔ blocked on a Decision Gate, ⏳ not started (in scope,
just not yet).

## Block 07 — primera venta real (entrenamiento)

- ✅ `/entrenar` differentiates its 4 offers with distinct CTAs/tracking
  (bug fixed this checkpoint).
- ✅ `b2b_opportunity` has a real write path (`shows`/`marcas` topics).
- ✅ Coaching tiers have real `offer` rows (`quote` mode, no price
  invented).
- 🚧 Facebook Subscription click tracking — the click itself is fully
  measurable today (`social_click`, slug-distinguishable); the visit/
  conversion on Facebook's side is not observable without a real Meta
  integration (out of scope per the brief — "no asumir integración API
  de Meta").
- ⛔ Facebook Subscription real URL — **Decision Gate 1**.
- ⛔ At least one real price + checkout provider (or an explicit
  decision to stay in `quote` mode for this block's close) — **Decision
  Gate 2**.
- ⏳ A real `orders`/`subscription` write path from an actual paid
  transaction — depends on Decision Gate 2.

## Block 08 — música + productos digitales

- ⏳ Not started. Depends on Decision Gate 3 (payment provider for
  digital goods) before the "access/delivery" mechanism can be
  designed for real.
- Architecture confirmed compatible with existing Commerce/CRM without
  rework (Block 07.1 audit, point K) — no schema debt expected.

## Block 09 — productos físicos

- ⏳ Not started. Depends on Decision Gate 4 (Droppy vs. manual
  fulfillment for the first catalog).

## Block 10 — automatizaciones (lifecycle marketing)

- ⏳ Not started. Depends on the lifecycle map being designed first —
  Decision Gate 5 (vendor) is deliberately deferred until then, per the
  brief's own instruction.

## Cross-cutting / production

- ✅ Supabase real deployed, 5 migrations + seed applied and audited
  (Block 06).
- ⏳ `schema_migrations` bootstrap on the real project — needed before
  any direct `npm run db:migrate` against production
  (docs/SUPABASE_PRODUCTION.md §12).
- ⏳ Block 07's new seed rows (coaching offers) not yet applied to the
  real Supabase project — data-only, safe once approved.
- ⏳ Vercel project/domain/production env vars — not started.
- ⏳ Checkout provider webhooks — depends on Decision Gate 2/3.
