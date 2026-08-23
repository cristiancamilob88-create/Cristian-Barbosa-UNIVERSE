<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cristian Barbosa Universe — project rules

Read `docs/ARCHITECTURE.md` before adding a route, a data model, or an
integration — it records the decisions already made (stack, folder
structure, data/analytics/attribution/security strategy) and the roadmap
order blocks are meant to land in. Don't re-decide something it already
settled without a stated reason.

- New commercial routes are folders under `src/app/`, and their nav
  label/description/order come from `src/config/site.ts` — don't hardcode
  a route path anywhere else (nav, footer, sitemap all read from there).
  Every route also carries an `intent`/`intentId` pair (the first-person
  CTA phrase + its `cta_click.cta` id, e.g. "Quiero entrenar" /
  `intent_training`) — see docs/UNIVERSE_UX.md. Never "Quiero ser parte"
  (too ambiguous); `src/config/site.test.ts` enforces uniqueness and the
  `intent_[a-z_]+` naming convention.
- Internal commercial CTAs use `TrackedLink`; outbound social/community
  links use `GoLink` (both in `src/components/ui/`) instead of a bare
  `<a>`/`<Link>`, so every click stays measurable — see
  docs/SOCIAL_ROUTING.md for why they're two different components.
- External input (forms, API routes) is validated with zod before it
  touches application logic — see `src/app/api/lead/route.ts` for the
  pattern (schema, honeypot, rate limit).
- No secrets in this repo. Every env var the app reads is declared in
  `src/lib/env.ts` (client-safe `NEXT_PUBLIC_*`) or `src/server/env.ts`
  (server-only, e.g. `DATABASE_URL`) and documented in `.env.example` —
  never read `process.env` directly anywhere else.
- Every database access goes through `src/server/db/` (pool + repository
  functions) inside a Route Handler — never from a client component, and
  never a raw query outside `src/server/db/repositories/`. Schema changes
  are a new file in `supabase/migrations/`, never an edit to an already-
  applied one — see docs/DATABASE.md.
- Read-model/reporting queries (aggregates, KPIs, funnels) go in
  `src/server/analytics/`, not `src/server/db/repositories/` — the
  repositories are the write path's CRUD; analytics is read-only
  composition on top. Before adding a new `interaction.event_name`,
  check docs/ANALYTICS_ENGINE.md's taxonomy audit — a near-duplicate of
  an existing event needs a stated reason, not just a new string.
  Never pass a single `PoolClient` to a function that fires more than
  one query via `Promise.all` (or vice versa) — see
  docs/ANALYTICS_ENGINE.md, "Testing", for the bug this caused.
- Don't add an analytics vendor, payment integration, or 3D/heavy motion
  library without checking `docs/ARCHITECTURE.md` §10-11 first — several
  of these are deliberately deferred, not forgotten.
- A "buy"/checkout CTA never links straight to a payment provider —
  point it at `/api/checkout/[offerSlug]` (`CheckoutLink`,
  `src/components/ui/CheckoutLink.tsx`) so `checkout_started` is
  recorded and `resolveCheckoutDestination()`
  (`src/server/commerce/checkout.ts`) decides where the offer actually
  sends the visitor — never hardcode a provider's URL in a page
  component. See docs/COMMERCE.md.
- `/admin/*` (the Command Center) never queries Postgres or imports
  `src/server/analytics/`/`src/server/db/` from a React component —
  every section fetches an existing `/api/analytics/*` endpoint via
  `src/components/admin/useAnalyticsQuery.ts`. Adding a business-data
  section to the dashboard means adding a page that calls an existing
  endpoint (or, if truly nothing covers it yet, a new
  `src/server/analytics/` read model + endpoint first, per the rule
  above) — never a query inside `src/app/admin/`. See
  docs/COMMAND_CENTER.md.
- Admin auth (`src/server/auth/`) is a single shared credential, not a
  users table — don't reach for a `users`/`sessions` schema to gate a
  new private route; extend `requireAdminSession()`/`requireAnalyticsAuth()`
  instead, and read docs/COMMAND_CENTER.md §2 before changing the
  session/login mechanism.
