# Cristian Barbosa Universe

The central digital hub for the Cristian Barbosa personal brand — one Next.js
application serving every pillar (training, community, music, products,
shows, brands, events, social) as routes of a single system, backed by a
real Postgres CRM, per [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

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
`/redes`, `/go/*`, `/api/lead`, and `/api/track` need `DATABASE_URL` set
— see [`docs/DATABASE.md`](docs/DATABASE.md).

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

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack decisions, folder
  structure, security, roadmap.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — CRM entity rationale.
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema reference, migrations.
- [`docs/CRM.md`](docs/CRM.md) — the `/api/lead` write-path walkthrough.
- [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md) — first/last-touch, QR, visitor→contact linking.
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — the event taxonomy.
- [`docs/SOCIAL_ROUTING.md`](docs/SOCIAL_ROUTING.md) — `/go/[slug]` and `/redes`.
- [`docs/AUDIENCE_JOURNEY.md`](docs/AUDIENCE_JOURNEY.md) — the acquisition→conversion data model, worked example.
- [`docs/SECURITY.md`](docs/SECURITY.md) — RLS, server-only access, secrets, rate limiting.

## Status

**Block 01 — Repository audit + technical foundation** and **Block 02 —
CRM + data + attribution + social routing + audience journey** are both
complete: full route scaffold, a real Postgres schema with RLS, an
end-to-end lead intake pipeline (attribution → contact → interest →
lead), first/last-touch attribution with visitor→contact linking,
server-tracked outbound social routing (`/go/[slug]`, `/redes`), CI with
a Postgres service running both test suites. Still not wired: any real
analytics vendor, payment/checkout, authentication, a visual dashboard —
see `docs/ARCHITECTURE.md` §11 for the full "not yet" list.
