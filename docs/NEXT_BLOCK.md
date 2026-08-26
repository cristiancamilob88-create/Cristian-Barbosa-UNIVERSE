# NEXT_BLOCK.md — what happens next, and why

## Block 08.10 is closed and the public preview is LIVE. NOT Block 09/10 yet

`https://cristian-barbosa-universe.vercel.app` is deployed and READY —
confirmed directly (Vercel MCP connector, connected mid-block: real
build logs, real runtime errors, a real fetch of the live page). Two
real build failures were found and fixed on the way (commits
`93eaae4`, `6f0e46f` — see docs/PROJECT_STATE.md for the full story).
Explicit instruction from Cristian still holds: don't continue toward
Block 09/10 or automations yet.

### The one thing left for Cristian to do manually in Vercel

Everything else is done. This is the single open item:

- **`DATABASE_URL` is saved in Vercel's env vars as an empty string**,
  not the real Supabase connection string — confirmed via a live
  runtime error (`ZodError: DATABASE_URL too_small`) and a live 500 on
  `/redes`. Go to the Vercel project's env var settings and replace it
  with the real Supabase **connection pooler** string (port 6543,
  "Transaction" mode, not the direct 5432 one — docs/SUPABASE_PRODUCTION.md
  §10, serverless connection limits). No redeploy needed after —
  Vercel picks up a changed env var on the next request/build
  automatically; a redeploy is still fine if it doesn't.
- Everything else (`NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD_HASH`,
  `ADMIN_SESSION_SECRET`, `ANALYTICS_API_TOKEN`) is either already
  correctly set or intentionally optional (unset = that feature
  fails closed, not broken — `/admin/*` just says "not configured").

### After `DATABASE_URL` is fixed

Re-check `/redes`, `/api/lead`, `/api/checkout/[offerSlug]`,
`/go/[slug]`, `/admin`'s dashboard sections, `/api/analytics/*` — all
DB-backed, all currently either failing or running in their fail-closed
state because of the blank `DATABASE_URL`. Then: navigate the real
preview → report any UX errors found → fix those → load real assets
(`docs/ASSETS_AND_BRAND.md`) → define visual identity → visual
optimization pass → connect the domain. Block 09/10 stay parked until
Cristian says otherwise.

## After that: Block 09 or Block 10 (Cristian's call)

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
5. Email/WhatsApp automation vendor — **partially resolved, 2026-08-25**:
   the lifecycle map exists now (docs/AUTOMATIONS.md) and email is
   decided + built (Gmail SMTP, not Resend — no domain purchased yet).
   WhatsApp is still open, pending Cristian getting a phone number
   dedicated to it (his current one is mixed personal/business) — full
   reasoning and researched options in docs/AUTOMATIONS.md.

## What NOT to rebuild when either block starts

CRM, Analytics, Commerce (`CheckoutLink`/`resolveCheckoutDestination()`/
`/api/checkout/[offerSlug]`), `GoLink`/`TrackedLink`, the `entitlement`
table (reuse it, don't build a second access mechanism), `b2b_opportunity`.
All confirmed solid and reusable as of Block 08's close.
