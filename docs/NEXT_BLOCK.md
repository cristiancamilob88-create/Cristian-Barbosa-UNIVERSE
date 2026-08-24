# NEXT_BLOCK.md — what happens next, and why

## Block 08.10 is closed. Immediate next step: Cristian redeploys on Vercel — NOT Block 09/10 yet

Explicit instruction from Cristian: don't continue toward Block 09/10
or automations until the public preview is actually up and verified.
The one thing standing between "code is Vercel-ready" and "there's a
real `https://*.vercel.app` URL" is a manual step only Cristian can do
— this session has no Vercel MCP/API/CLI access.

### What Cristian needs to do manually in Vercel

1. In the Vercel project's dashboard, set the environment variables
   (Production, and Preview if desired) — values are Cristian's to
   provide, never written here or anywhere in this repo:
   - `DATABASE_URL` — the Supabase **connection pooler** string
     (port 6543, "Transaction" mode), not the direct 5432 one — see
     `docs/SUPABASE_PRODUCTION.md` §10 for why (serverless connection
     limits).
   - `NEXT_PUBLIC_SITE_URL` — the Vercel preview URL for now (or the
     eventual domain, once connected).
   - `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`,
     `ANALYTICS_API_TOKEN` — generate per `.env.example`'s own
     instructions (`node scripts/admin/hash-password.mjs`,
     `openssl rand -hex 32`); without these, `/admin/*` simply reports
     "not configured" and stays fail-closed — not a broken deploy.
2. Trigger a redeploy (push already landed the `DATABASE_URL` fix and
   the Node version pin — commit `93eaae4`; a redeploy from the latest
   commit on `claude/cristian-barbosa-master-init-jxln6u` picks both up
   automatically).
3. Share the resulting `https://*.vercel.app` URL and, if it still
   fails, the actual build log — this session could not see Vercel's
   real error text (no MCP/PR-based access), so the fix applied is the
   most plausible root cause found by static audit, not a confirmed
   match against Cristian's literal error.

### After a working preview URL exists

Per Cristian's own sequencing (Fase 8): navigate the real preview →
report any UX errors found → fix those → load real assets
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
5. Email/WhatsApp automation vendor — deliberately deferred until the
   Block 10 lifecycle map exists.

## What NOT to rebuild when either block starts

CRM, Analytics, Commerce (`CheckoutLink`/`resolveCheckoutDestination()`/
`/api/checkout/[offerSlug]`), `GoLink`/`TrackedLink`, the `entitlement`
table (reuse it, don't build a second access mechanism), `b2b_opportunity`.
All confirmed solid and reusable as of Block 08's close.
