# MASTER_CHECKLIST.md — Blocks 07–10, itemized

Tracks every concrete item from `docs/MASTER_BRIEF_BLOCK_07_10.md`
against its real state. Updated at every checkpoint close. ✅ done,
🚧 partial, ⛔ blocked on a Decision Gate, ⏳ not started (in scope,
just not yet).

## Block 07 — primera venta real (entrenamiento) + Universe comercial completo

- ✅ `/entrenar` differentiates its 4 offers with distinct CTAs/tracking.
- ✅ `b2b_opportunity` has a real write path (`shows`/`marcas` topics).
- ✅ Coaching tiers have real `offer` rows with real prices, closing
  over WhatsApp comercial (not an automated checkout — by design).
- ✅ Facebook Subscription: real URL, real price (29.900 COP/mes), real
  checkout redirect via `CheckoutLink` — `checkout_started` is a real
  event now, not reserved taxonomy.
- ✅ `/comunidad`, `/musica`, `/productos`, `/shows`, `/marcas`,
  `/about`, `/eventos`, `/redes` all updated with real destinations/
  prices/segments per Cristian's brief — see `docs/UNIVERSE_UX.md` §7
  for the full page-by-page list.
- ✅ CRM topic split: `productos_fisicos`/`productos_digitales` now map
  to their own `interest` rows (were both generic `productos` before).
- ✅ Every real social channel seeded (`supabase/seed.sql`) — WhatsApp
  comercial, Instagram Comunidad, TikTok secundario, Facebook x2, X.
- ✅ Security Gate reviewed (§07.SEC) — no new findings; the 2 findings
  inherited from Block 06 remain open, undocumented-as-fixed.
- ✅ Preview Milestone: 8 pages screenshotted and sent to Cristian; every
  touched route smoke-tested; the two real redirect paths curl-verified
  end to end against a running local server.
- ✅ lint/typecheck/unit(98)/integration(78)/build all green locally.
- ⛔ **Apply migration `0006` + the real seed data to the real Supabase
  project** — blocked on the Supabase MCP connector not being enabled
  for this specific chat session (connected at account level already).
  This is the only open item closing Block 07.
- 🚧 Facebook Subscription click tracking — the click itself is fully
  measurable (`checkout_started`, attributed to the offer); the visit/
  payment confirmation on Facebook's side is not observable without a
  real Meta integration (correctly out of scope, per the brief).

## Block 08 — música + productos digitales

- ⏳ Not started. Depends on Decision Gate 3 (payment provider for
  digital goods) before the "access/delivery" mechanism can be
  designed for real. Música's price model (10.000 COP/canción) is
  confirmed and shown on `/musica`, but no product/offer row exists —
  the song's own identity (title, artwork) isn't confirmed yet.

## Block 09 — productos físicos

- ⏳ Not started. Depends on Decision Gate 4 (Droppy vs. manual
  fulfillment for the first catalog). `/productos`'s physical block now
  has a real WhatsApp comercial CTA as its interim path.

## Block 10 — automatizaciones (lifecycle marketing)

- ⏳ Not started. Depends on the lifecycle map being designed first —
  Decision Gate 5 (vendor) is deliberately deferred until then.

## Cross-cutting / production

- ✅ Supabase real deployed, 5 migrations + seed applied and audited
  (Block 06).
- ⛔ Migration `0006` + Block 07's real seed data not yet applied to
  the real Supabase project (see Block 07's own item above).
- ⏳ `schema_migrations` bootstrap on the real project — needed before
  any direct `npm run db:migrate` against production
  (docs/SUPABASE_PRODUCTION.md §12).
- ⏳ Vercel project/domain/production env vars — not started.
- ⏳ Checkout provider webhooks — depends on Decision Gate 2/3
  (partially resolved: Facebook Subscription has no webhook by design,
  confirmed manual reconciliation model).
