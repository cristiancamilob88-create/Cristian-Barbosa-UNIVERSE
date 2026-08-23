# Cristian Barbosa Universe

The central digital hub for the Cristian Barbosa personal brand — one Next.js
application serving every pillar (training, community, music, products,
shows, brands, events, social) as routes of a single system, backed by a
real Postgres CRM and analytics engine, per
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · zod · Postgres (Supabase in production) · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL to a local Postgres

npm run db:migrate
npm run db:seed
npm run dev
```

The app runs without a database for most routes, but `/contacto`,
`/redes`, `/go/*`, `/api/lead`, `/api/track`, `/api/analytics/*`, and
`/admin/*` need `DATABASE_URL` set — see [`docs/DATABASE.md`](docs/DATABASE.md).
`/api/analytics/*` additionally needs `ANALYTICS_API_TOKEN` or
`ADMIN_SESSION_SECRET` set, or it returns 503 (fails closed — see
[`docs/SECURITY.md`](docs/SECURITY.md)). `/admin/*` (the Command Center)
needs `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` set — generate the
first with `node scripts/admin/hash-password.mjs` — see
[`docs/COMMAND_CENTER.md`](docs/COMMAND_CENTER.md).

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest — fast unit tests, no database needed |
| `npm run test:integration` | Vitest — DB-backed suite, needs `DATABASE_URL` + `npm run db:setup:test` first |
| `npm run db:migrate` | Apply pending `supabase/migrations/*.sql` |
| `npm run db:seed` | Load safe development seed data |
| `npm run db:setup:test` | Local/CI only: auth shim + migrate + seed, for a disposable test database |
| `node scripts/admin/hash-password.mjs` | Generates `ADMIN_PASSWORD_HASH` for `/admin` login (docs/COMMAND_CENTER.md) |

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack decisions, folder
  structure, security, roadmap.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — CRM entity rationale.
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema reference, migrations.
- [`docs/CRM.md`](docs/CRM.md) — the `/api/lead` write-path walkthrough.
- [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md) — first/last-touch, QR, visitor→contact linking.
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — the event taxonomy.
- [`docs/ANALYTICS_ENGINE.md`](docs/ANALYTICS_ENGINE.md) — the read-model engine: taxonomy audit, session model, funnels, testing.
- [`docs/KPI_DEFINITIONS.md`](docs/KPI_DEFINITIONS.md) — every KPI's exact formula.
- [`docs/REPORTING.md`](docs/REPORTING.md) — the `/api/analytics/*` API reference.
- [`docs/COMMAND_CENTER.md`](docs/COMMAND_CENTER.md) — the `/admin` dashboard: admin auth model, routes, what each section consumes.
- [`docs/UNIVERSE_UX.md`](docs/UNIVERSE_UX.md) — the public site's intention architecture: the CTA/intent map, per-pillar changes, tracking.
- [`docs/COMMERCE.md`](docs/COMMERCE.md) — commerce/offers infrastructure: the product/offer model review, the checkout abstraction, what's not wired yet.
- [`docs/SUPABASE_PRODUCTION.md`](docs/SUPABASE_PRODUCTION.md) — taking this schema to a real Supabase project: expected state, RLS, env vars, deployment/rollback notes.
- [`docs/MANUAL_SETUP_CHECKLIST.md`](docs/MANUAL_SETUP_CHECKLIST.md) — Supabase/GitHub/Vercel/DNS/Meta/etc., split by what Claude can automate vs. what only Cristian can do.
- [`docs/MASTER_BRIEF_BLOCK_07_10.md`](docs/MASTER_BRIEF_BLOCK_07_10.md) — the Revenue Activation + Lifecycle Marketing brief (Blocks 07–10): source of truth for this stage.
- [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) / [`docs/MASTER_CHECKLIST.md`](docs/MASTER_CHECKLIST.md) / [`docs/NEXT_BLOCK.md`](docs/NEXT_BLOCK.md) — living checkpoint snapshot, itemized checklist, and next-step plan for Blocks 07–10, updated at every block close.
- [`docs/SOCIAL_ROUTING.md`](docs/SOCIAL_ROUTING.md) — `/go/[slug]` and `/redes`.
- [`docs/AUDIENCE_JOURNEY.md`](docs/AUDIENCE_JOURNEY.md) — the acquisition→conversion data model, worked example.
- [`docs/SECURITY.md`](docs/SECURITY.md) — RLS, server-only access, secrets, rate limiting, analytics endpoint auth.

## Status

**Block 01 — foundation**, **Block 02 — CRM + data + attribution +
social routing + audience journey**, **Block 03 — analytics engine +
conversion measurement + data read models**, **Block 04 — Command
Center (admin auth + analytics dashboard)**, **Block 04.1 — Command
Center visual/data layer**, **Block 04.2 — Universe UX + conversion
architecture**, **Block 05 — Commerce/offers/conversion
infrastructure**, and **Block 06 — real Supabase project deployed**
are all complete: full route scaffold, a real Postgres schema with RLS
— now live on the real Supabase project (`Cristian-Barbosa-UNIVERSE`,
docs/SUPABASE_PRODUCTION.md §3), not just designed — an end-to-end lead
intake pipeline, first/last-touch attribution with visitor→contact
linking, server-tracked outbound social routing, a full read-model
query layer (acquisition/engagement/leads/revenue/funnel/session/
journey/commerce) behind 10 private `/api/analytics/*` endpoints, a
single-admin login protecting a 10-section `/admin` dashboard with
trend sparklines and period comparisons, an intention-based public UX
(every route has an approved CTA phrase, docs/UNIVERSE_UX.md), a
checkout abstraction ready for a real payment provider
(docs/COMMERCE.md), and both test suites (unit + DB-backed integration)
green. Still not wired: any real analytics vendor, a real payment
provider, multi-user authentication, charts/visual design polish, a
Vercel deployment — see `docs/ARCHITECTURE.md` §11 and
`docs/SUPABASE_PRODUCTION.md` §12-13 for the full "not yet" list.

**Block 07 — first real sale (training)** is in progress: the funnel
is real end to end up to lead capture (`/entrenar` now differentiates
its 4 offers correctly, `b2b_opportunity` has its first writer, coaching
has real `offer` rows), but closing with an actual paid sale needs two
Decision Gates resolved by Cristian (Facebook Subscription's real URL,
and at least one real price/checkout provider) — see
`docs/PROJECT_STATE.md`/`docs/NEXT_BLOCK.md` for the live status and
`docs/MASTER_BRIEF_BLOCK_07_10.md` for the full Blocks 07–10 brief
(Revenue Activation + Lifecycle Marketing).
