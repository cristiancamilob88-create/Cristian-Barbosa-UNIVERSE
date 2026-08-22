# Cristian Barbosa Universe

The central digital hub for the Cristian Barbosa personal brand — one Next.js
application serving every pillar (training, community, music, products,
shows, brands, events) as routes of a single system, per
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · zod · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit tests for `src/lib/`) |

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack decisions, folder
  structure, security, roadmap.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — the conceptual CRM entities
  in `src/types/crm.ts` and why they're shaped this way.
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — the event taxonomy in
  `src/lib/analytics.ts`.

## Status

**Block 01 — Repository audit + technical foundation** is complete: route
scaffold, shared layout/design tokens, attribution proxy, lead-intake
API with validation and rate limiting, SEO file conventions, security
headers, CI. No database, analytics vendor, or payment integration is wired
yet — see Architecture §11 for the full "not yet" list.
