# MASTER_CHECKLIST.md — Blocks 07–08.10, itemized

Tracks every concrete item against its real state. Updated at every
checkpoint close. ✅ done, 🚧 partial, ⛔ blocked on a Decision Gate,
⏳ not started (in scope, just not yet).

## Block 07 — CERRADO

All items closed, including production application (migrations
`0001`–`0006`, real seed data, verified live on Supabase). See
`docs/MASTER_BRIEF_BLOCK_07_10.md` for the full detail.

## Block 08 — CERRADO

### 08.0 — Experience + assets + navigation audit

- ✅ Audited all 11 routes — found one real P0: mobile navigation
  completely broken (no fallback below `lg`). Fixed and verified.
- ✅ `docs/ASSETS.md` — placeholder convention + per-department checklist.
- ✅ `/redes` confirmed showing all real profiles (no code change needed).

### 08.1 — Entrenar / Comunidad / Coaching

- ✅ Reviewed — already solid from Block 07 (real prices, differentiated
  CTAs, WhatsApp comercial for coaching). No rebuild needed.

### 08.2 — Música

- ✅ `entitlement` table + repository built and tested — the reusable
  "access after confirmed purchase" primitive, generic across future
  songs/digital products.
- ✅ Applied to real Supabase, verified live.
- ⛔ No real song/product yet (title/artwork unconfirmed) — `entitlement`
  ships correctly unpopulated. Blocked on a content decision from
  Cristian, not a technical gap.
- ⛔ Decision Gate 3 (payment provider) — still open, blocks a real
  writer for `entitlement` via an actual checkout flow.

### 08.3 — Productos digitales

- ✅ Reviewed — Block 07's WhatsApp/lead-capture flow already matches
  the brief's own `catálogo → producto → oferta → CTA → registro →
  checkout o contacto → entrega futura` model. No specific product
  invented (none confirmed).

### 08.4 — Productos físicos

- ✅ Reviewed — same as 08.3, WhatsApp comercial CTA already in place.
- ⛔ Decision Gate 4 (Droppy vs. manual) — still open, doesn't block
  the MVP manual model already live.

### 08.5 — Shows

- ✅ Reviewed — real segment list + 5 starting package formats already
  shipped in Block 07. No further work needed.

### 08.6 — Marcas / Sponsors

- ✅ Reviewed — confirmed ambassadorships (Club Nativos, Expo Fitness) +
  WhatsApp comercial CTA already shipped in Block 07.

### 08.7 — Historia

- ✅ Reviewed — themed grid + press mention + 8-pillar bridge already
  shipped in Block 07.

### 08.8 — Eventos

- ✅ Restructured into 4 real categories (propios/participaciones/
  próximos/presentaciones pasadas) — honest empty states, no fabricated
  event.
- ⏳ No `event` table — deliberately deferred until a real event exists
  to design its shape against (avoids speculative schema debt).

### 08.9 — Redes sociales

- ✅ Reviewed — all real channels already seeded in Block 07, `/redes`
  renders them with no code change needed.

### Cross-cutting

- ✅ Mobile audit done (§13) — the one real bug found and fixed.
- ✅ lint/typecheck/unit(98)/integration(82)/build all green locally.
- ✅ Migration `0007_entitlement.sql` applied and verified on the real
  Supabase project.
- ✅ Preview screenshots (desktop + mobile, before/after the nav fix)
  reviewed during the session.

## Cross-cutting / production

- ✅ Supabase real: migrations `0001`–`0007` applied and verified.
- ⏳ `schema_migrations` bootstrap on the real project — unchanged gap
  from Block 06.
- 🚧 Vercel project/domain/production env vars — Cristian imported the
  repo; first deploy attempt FAILED. See Block 08.10 below.
- ⛔ Decision Gates 3 (música/productos digitales payment), 4 (Droppy),
  5 (email/WhatsApp vendor) — all still open, none block Block 08's
  close, all needed for Block 09/10's real close.

## Block 08.10 — CERRADO (public preview + Vercel readiness)

- ✅ Fase 1 — audit: `package.json`/`next.config.ts`/`tsconfig.json`/
  `src/lib/env.ts`/`src/server/env.ts` inspected directly (no error
  guessed). Found `DATABASE_URL` non-optional in the server env schema
  despite 3 call sites never reading it — crashes with zero env vars
  configured, matching a fresh Vercel import exactly.
- ✅ Fase 2 — fix: `DATABASE_URL` made optional in
  `src/server/env.ts`, real requirement moved to
  `src/server/db/pool.ts`'s `getPool()`; `package.json` gained
  `engines.node >=20.9.0`. lint/typecheck/unit(102)/integration(82)/
  build all green; zero-env-var build+run smoke test passed.
- ✅ Fase 3 — Supabase production env vars confirmed against
  `docs/SUPABASE_PRODUCTION.md` §6/§10 (unchanged from Block 06): only
  `DATABASE_URL` (pooler connection string recommended for Vercel
  serverless), `NEXT_PUBLIC_SITE_URL`, `ANALYTICS_API_TOKEN`,
  `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`. No new migration run;
  `db:migrate` not run against production (unchanged rule).
- ⛔ Fase 4 — public preview: cannot be executed from this session (no
  Vercel MCP/API/CLI access, no PR exists for this direct-push branch
  to inspect GitHub-posted deployment status). Requires Cristian's
  manual redeploy in the Vercel dashboard.
- 🚧 Fase 5 — commercial audit: repeated locally (this session's own
  zero-env-var smoke test + the prior Experience Audit's real-browser
  navigation pass) — a live-Vercel-URL repeat still pending Fase 4.
- ✅ Fase 6 — `docs/ASSETS_AND_BRAND.md` (new): 16 categories, each
  REAL/PENDIENTE/PLACEHOLDER, nothing invented or uploaded.
- ✅ Fase 7 — `/redes` audited: `social_profile.category` exists and is
  seeded correctly but the page never reads it — root cause of the
  "flat list" feel. Documented in `docs/UNIVERSE_UX.md` §8, no redesign
  executed.
- ✅ Fase 8 — domain: confirmed NOT connected, per explicit instruction.
- ✅ Fase 9 — this file + `docs/PROJECT_STATE.md` + `docs/NEXT_BLOCK.md`
  updated with explicit status fields.
