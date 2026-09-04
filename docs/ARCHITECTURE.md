# ARCHITECTURE.md — Cristian Barbosa Universe

Technical architecture for the digital core of the Cristian Barbosa personal
brand ecosystem. This document was written for **Block 01 — Repository
Audit + Technical Foundation** and is kept current through every block
after it — **Block 02 — CRM + Data + Attribution + Social Routing +
Audience Journey** landed the database, the CRM write path, and outbound
social routing described in §4–§7 below; **Block 03 — Analytics Engine +
Conversion Measurement + Data Read Models** landed the event taxonomy
extensions, the read-model query layer, and the `/api/analytics/*` API;
**Block 04 — Command Center** landed a minimal admin login and the first
functional private dashboard consuming that API. See docs/DATABASE.md,
docs/CRM.md, docs/ATTRIBUTION.md, docs/SOCIAL_ROUTING.md,
docs/AUDIENCE_JOURNEY.md, docs/ANALYTICS_ENGINE.md, docs/KPI_DEFINITIONS.md,
docs/REPORTING.md, and — for Block 04 — docs/COMMAND_CENTER.md for the
block-specific detail this file only summarizes.

## 1. Audit — state before this block

The repository (`cristiancamilob88-create/cristian-barbosa-universe`) was
**completely empty**: no commits, no branches, no files, no framework, no
dependencies. There was nothing to preserve and nothing to migrate — this
is a greenfield foundation, not a refactor.

The adjacent library repo (`cristian-claude-skills`) is a **personal,
cross-project Claude Code skills library**, not part of this product. It
currently vendors 27 skills across two categories relevant here:

- **Frontend/design (9)** — `frontend-design`, `better-interface` and its
  six `better-*` reviewers, `interface-review`.
- **Animation (8)** — 5 core (`gsap-web`, `60fps-animation`,
  `accessible-animation`, `micro-interaction`, `svg-animation`) + 3
  specialized, installed per-project only when needed.
- **3D (10)** — `threejs-*`, explicitly out of scope for now (see Product
  Vision: "NO priorizar 3D todavía").

It has **no** backend, database, CRM, analytics, security, testing, or SEO
skills — those categories don't exist in the library yet ("Se crearán
cuando exista contenido real que vendorizar"). That gap is expected and is
not a blocker: this stack doesn't need a skill for those disciplines, it
needs plain, well-reviewed engineering, which is what this block delivers.

**Skills used in this block:** `frontend-design`, for the token system and
layout direction in Section 8. **Skills deliberately not used:** the
`better-*` review suite (there is no shipped interface yet to review — the
right block for that is after Block 01 lands and gets used), anything from
`animation/` or `3d/` (out of scope per Product Vision), and anything from
`cristian-claude-skills` that isn't vendored yet (Supabase/n8n research
exists but nothing is installed — do not treat the research docs as
approval to integrate either).

## 2. Stack decision

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router), TypeScript, React 19** | One project serves every route in the brief (`/`, `/entrenar`, `/comunidad`, ...) with per-route metadata, a shared layout, and a single deploy — exactly the "un solo web application" requirement. Server Components keep marketing pages fast without a separate API to maintain yet. |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`) | Fast to build consistent, on-brand UI across nine+ routes without hand-rolling a component library this early. |
| Package manager | **npm** | Already present in the environment; no reason to add a second toolchain. |
| Validation | **zod** | Both server (`/api/lead`) and client (`ContactForm`) validate against the same rules by hand-mirrored schemas today; once forms multiply, share one schema module instead of duplicating (see Roadmap). |
| Testing | **Vitest**, two configs | `vitest.config.mts` (fast, no-DB unit tests) + `vitest.integration.config.mts` (DB-backed, `npm run test:integration`) — split so `npm test` never silently requires a live database. |
| Data layer | **Postgres** (local dev/CI, Supabase in production) | See §4 — implemented in Block 02. |
| Deployment target | **Vercel** (recommended, not yet wired) | Native Next.js support (Edge Middleware, ISR, image optimization), first-party env var management per environment, zero-config preview deployments per PR — the least operational overhead for a single Next app. No account/project was created in this block; this is a documented decision, not an implemented integration. |

## 3. Folder structure

```
src/
  app/                    routes — one folder per pillar, App Router convention
    entrenar/ comunidad/ musica/ productos/ shows/ marcas/ eventos/ about/ contacto/ redes/
    admin/                 Command Center (Block 04, docs/COMMAND_CENTER.md)
      login/               public — password form + loginAction Server Action
      (dashboard)/          route group: layout.tsx (auth guard + nav) + 10 section pages
    api/lead/route.ts     lead intake — validation, rate limit, full CRM persistence (docs/CRM.md)
    api/track/route.ts    persistence sink for a subset of client analytics events
    api/analytics/*       10 private read-model endpoints (Block 03/04.1/05, docs/REPORTING.md)
    api/checkout/[offerSlug]/route.ts  offer → checkout redirect + checkout_started tracking (Block 05, docs/COMMERCE.md)
    go/[slug]/route.ts    outbound social redirect + server-side click tracking (docs/SOCIAL_ROUTING.md)
    layout.tsx            shared shell: fonts, <Header/>, <Footer/>, Person JSON-LD
    sitemap.ts robots.ts  SEO file conventions
  components/
    layout/               Header, Footer, PageHero (shared route hero shell)
    ui/                   Container, TrackedLink (internal CTA tracking), GoLink (outbound routing)
    forms/                ContactForm (client component)
    analytics/             PageViewTracker (Block 03)
    admin/                 Command Center UI primitives — DateRangeControl, useAnalyticsQuery,
                            AnalyticsBoundary, Table/PerformanceTable, StatTile, FunnelBars (Block 04)
  lib/
    attribution.ts         UTM/QR/referral parsing — pure functions, unit tested
    analytics.ts            client event taxonomy + pluggable sink (console + /api/track)
    adminAnalytics.ts        client-side /api/analytics/* contract + fetch helper (Block 04)
    format.ts                currency/integer/ratio display formatting (Block 04)
    seo.ts                   per-route Metadata builder
    env.ts                   validated client-safe (NEXT_PUBLIC_*) env access
  server/
    env.ts                   validated server-only env access (DATABASE_URL, ANALYTICS_API_TOKEN, ADMIN_*)
    auth/                    admin login: password.ts, session.ts, loginFlow.ts, loginRateLimit.ts,
                              adminAuth.ts (Block 04, docs/COMMAND_CENTER.md)
    analytics/                read-model query layer — one file per topic (Block 03, docs/ANALYTICS_ENGINE.md)
    db/pool.ts               server-only pg Pool singleton
    db/transaction.ts        withTransaction() helper
    db/visitorContext.ts     resolveVisitorContext() — the entry point every DB route calls first
    db/repositories/         one file per entity: reference, visitor, contact, interaction, lead, socialProfile, offer (Block 05)
    commerce/checkout.ts     resolveCheckoutDestination() — the offer→checkout decision point (Block 05, docs/COMMERCE.md)
  proxy.ts                  visitor/attribution cookies (docs/ATTRIBUTION.md) + optimistic /admin/* auth
                             gate (Block 04, docs/COMMAND_CENTER.md) — no DB access either way
  types/crm.ts              application-facing CRM types (the DB migrations are now the literal source of truth)
  config/site.ts             nav items, brand copy, /go/ slugs — single source of truth (no /admin entry, by design)
supabase/
  migrations/                versioned schema SQL (docs/DATABASE.md)
  seed.sql                   safe development seed data
scripts/db/                  migrate.mjs, seed.mjs, setup-test-db.mjs, test-auth-shim.sql (local/CI only)
scripts/admin/                hash-password.mjs — generates ADMIN_PASSWORD_HASH (Block 04)
docs/                        this file + DATA_MODEL, ANALYTICS, ANALYTICS_ENGINE, KPI_DEFINITIONS, REPORTING,
                              CRM, ATTRIBUTION, DATABASE, SECURITY, SOCIAL_ROUTING, AUDIENCE_JOURNEY, COMMAND_CENTER
```

Rationale: routes stay thin (hero + a data-driven grid), shared logic lives
in `lib/`, all database access is isolated under `src/server/db/` (never
imported by a client component — see docs/SECURITY.md), and
`config/site.ts` is the one place a new route or nav label gets added —
nothing else hardcodes the route list (nav, footer, sitemap all read from
it).

## 4. Data strategy — implemented in Block 02

**Decision (made in Block 01, executed in Block 02): Postgres via
Supabase.** Reasoning, weighed against the CRM's actual shape (§5):

- The CRM model is relational (a Contact has many Interactions, Interests,
  Orders) — a document store would just reinvent joins in application code.
- Supabase bundles Postgres + Auth + Row Level Security + Storage, which
  matches the later roadmap items (user accounts, membership, file
  uploads for coaching) without adding a second vendor per feature.
- It already appears as researched-but-not-vendorized in the skills
  library (`docs/supabase-skills-research.md`), so tooling exists to draw
  on without starting research from zero.

What exists now: a full versioned schema (`supabase/migrations/`, 17
tables), RLS policies, a migration runner (`npm run db:migrate`), safe
seed data (`npm run db:seed`), and a server-only repository layer
(`src/server/db/`) every DB-backed route goes through. Full detail in
docs/DATABASE.md. **Not connected to any real Supabase project** in this
block — every migration/test ran against a disposable local/CI Postgres
("do not connect to or modify production Supabase unless explicitly
authorized").

## 5. CRM strategy — implemented in Block 02

See docs/DATA_MODEL.md for the full entity rationale and docs/CRM.md for
the write-path walkthrough. Summary: one `contact` accumulates many
`interest`, `interaction`, `lead`, and (schema-ready, not yet written to)
`orders`/`subscription` rows over time — many-to-many journey, not one
row per form. First/last-touch attribution is captured at the `visitor`
level (pre-identification) and copied onto `contact` once a visitor is
identified — see docs/ATTRIBUTION.md for exactly when each is written.

## 6. Analytics strategy — partially implemented in Block 02

See docs/ANALYTICS.md for the full event taxonomy and which events are
now persisted vs. still console-only. Summary: page code never calls a
vendor SDK directly — everything goes through `track()` in
`lib/analytics.ts`. As of Block 02, `cta_click` is persisted to the
`interaction` table via `/api/track`; `whatsapp_click`/`social_click` are
tracked server-side via `/go/[slug]` instead (docs/SOCIAL_ROUTING.md);
`lead_submit` is recorded server-side by `/api/lead` itself. No real
analytics *vendor* (GA4/Meta Pixel/PostHog) is wired yet — that's still a
one-file change (`registerAnalyticsSink()`) away, not a per-page rewrite.

## 7. Attribution strategy — implemented in Block 02

UTM parameters, QR-driven `?qr=<slug>` scans, and referrer-based channel
classification (`organic_social`, `organic_search`, `referral`, `direct`)
are captured in `src/proxy.ts` at the edge, before any page renders — not
left to a form field to reconstruct later. Two first-party cookies
(`cb_attr_first`, `cb_attr_last`, 90-day expiry) plus a third
(`cb_visitor`, 2-year expiry, the anonymous identity anchor) exist purely
at the edge; the actual `visitor`/`contact` database rows are written
lazily by Node.js route handlers the first time attribution actually
needs to be persisted (Edge Runtime can't hold a Postgres connection).
Full mechanics, including the first-touch/last-touch enforcement and the
visitor→contact linking, in docs/ATTRIBUTION.md.

**QR campaigns**: a `qr_source` table now exists (pre-registered codes
only, never auto-created — see docs/DATABASE.md) but no QR *image*
generator was built (still not required). A QR's printed URL encodes both
the usual `utm_source`/`utm_medium=qr`/`utm_campaign` and a `?qr=<slug>`
identifying which registered code was scanned.

**Privacy**: only first-party, non-fingerprinting data is stored (the
campaign labels already present in the visitor's own URL/referrer, plus
an opaque UUID). No consent banner exists yet because nothing collected
is an advertising cookie — revisit before adding a third-party pixel (see
Roadmap and docs/SECURITY.md).

## 8. Design system (foundation pass)

Token system (see `src/app/globals.css`), chosen against the brief's own
instruction to avoid "diseño genérico de SaaS":

- **Color** — `ink` (#0b0d0c, near-black, not pure black), `chalk`
  (#f3f1ea, off-white), `ember` (#ff5a1f, the one accent — effort/heat/
  stage light), `rust` (#c8420f, pressed state), `steel`/`steel-dim`
  (muted neutrals for secondary text and borders).
- **Type** — Big Shoulders Display (condensed, industrial — display/H1),
  Inter (body), JetBrains Mono (eyebrows, nav tags, data-flavored labels
  like `SOURCE: AURA-ENVIGADO`) — deliberately not the cream/serif or
  acid-green/near-black defaults called out as generic in the design
  brief.
- **Signature element** — a CSS-only horizontal ticker of the universe's
  pillars under the homepage hero (scoreboard/lower-third reference,
  static under `prefers-reduced-motion`).
- **Motion — no longer deferred, 2026-08-28**: Cristian explicitly asked
  to start ("quiero algo así, brutal" — Apple/premium-site scroll feel).
  `gsap` + `ScrollTrigger` installed; `src/components/ui/Reveal.tsx` is
  the first reusable piece (fade/slide-up on scroll into view, respects
  `prefers-reduced-motion` same as the ticker above), shipped first on
  the homepage hero + pillar grid only — sitewide rollout is next,
  pending his sign-off on the feel. **3D/WebGL is still deferred**: he
  wants one real 3D signature piece (his logo, rotating, in the
  homepage hero) as a separate follow-up, not sitewide 3D — flagged
  explicitly as a mobile-performance risk given his traffic comes
  mostly from Instagram/WhatsApp on phones.

## 9. Security

Full model in docs/SECURITY.md. Summary:

- **Secrets**: none in the repo. `.env.example` documents every var this
  app reads — client-safe vars in `src/lib/env.ts`, server-only vars
  (`DATABASE_URL`) in `src/server/env.ts`, validated lazily so an
  unrelated build never needs a live database.
- **Server-only DB access**: every file under `src/server/db/` is
  `server-only`-guarded; there is no client-side database access anywhere.
- **RLS**: enabled on every table (`supabase/migrations/0002_rls_policies.sql`),
  default-deny for `anon`/`authenticated` except three genuinely public
  read-only tables. Today's actual boundary is that all writes use a
  server-only connection, not RLS — RLS is defense-in-depth, prepared for
  a future block that adds client-side reads.
- **Input validation**: every external input (`/api/lead`, `/api/track`,
  `ContactForm`) is parsed through zod; invalid input never reaches
  application logic. Proven inert against SQL-metacharacter payloads by
  integration tests (parameterized queries throughout).
- **Analytics endpoint authorization**: `/api/analytics/*` accepts the
  admin session cookie (below) or a bearer token (`ANALYTICS_API_TOKEN`),
  fails closed (503) if neither is configured — see docs/SECURITY.md,
  "Analytics endpoint authorization".
- **Admin authentication (Block 04)**: `/admin/*` is a single shared
  password (`ADMIN_PASSWORD_HASH`, scrypt-hashed, never plaintext) behind
  a signed, stateless session cookie — checked optimistically in
  `src/proxy.ts` and authoritatively in `requireAdminSession()`. See
  docs/SECURITY.md, "Admin authentication", and docs/COMMAND_CENTER.md §2.
- **Form protection**: a honeypot field plus a simple in-memory sliding-
  window rate limit (5 requests/IP/minute) on `/api/lead`. Documented
  limitation: in-memory state doesn't survive a redeploy and doesn't
  coordinate across instances — fine for a single-instance foundation
  deploy, not for production scale (see Roadmap).
- **HTTP headers**: `next.config.ts` sets `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and a
  baseline `Content-Security-Policy` on every route.
- **Data minimization**: attribution/visitor cookies store only campaign
  labels already present in the URL/referrer plus an opaque UUID —
  nothing else is collected because nothing else is needed yet.

## 10. Roadmap (proposed block order)

1. **Block 01 — Repository audit + technical foundation** ✅.
2. **Block 02 — CRM + data + attribution + social routing + audience
   journey** ✅: Postgres schema + RLS, `/api/lead` persistence end to
   end, `visitor`→`contact` linking, `/go/[slug]` outbound routing,
   `/redes`, the unified `interaction` journal.
3. **Block 03 — Analytics engine + conversion measurement + data read
   models** ✅: `interaction` extended for per-event medium/content/term/
   referrer + polymorphic entity references (`0003_analytics_engine.sql`);
   4 new taxonomy events (`contact_created`, `outbound_click`,
   `product_view`, `offer_view`); the full read-model query layer
   (`src/server/analytics/`) — acquisition/engagement/leads/revenue/
   funnel/session/journey; 8 private `/api/analytics/*` endpoints
   (docs/REPORTING.md); `page_view`/`landing_view` now persisted. No
   visual dashboard yet — this block was exactly "data/read-models first".
   A real analytics vendor is still not wired (Product Vision, still true).
4. **Block 04 — Command Center: admin auth + analytics dashboard** ✅:
   single-admin login (`src/server/auth/`, docs/COMMAND_CENTER.md),
   `/admin/*` protected by Proxy (optimistic) + `requireAdminSession()`
   (authoritative); the first functional private dashboard — 10 sections,
   every one consuming an existing `/api/analytics/*` endpoint, none
   querying Postgres directly. `requireAnalyticsAuth()` now accepts the
   admin session cookie alongside the Block 03 bearer token. No charts,
   no 3D, no heavy motion yet (explicit non-goal, same as Block 03's own
   deferrals).
5. **Block 04.1 — Command Center visual/data layer** ✅: `medium` joined
   source/campaign/QR as a `getPerformanceByDimension()` dimension;
   `getDailySeries()` (day-bucketed trend), `getRecentLeads()` (the one
   row-list read model in this app), delta-vs-previous-period
   comparisons, and inline-SVG Sparkline/MiniBar/FunnelBars visuals — no
   charting library, dataviz-skill method (docs/COMMAND_CENTER.md §16).
6. **Block 04.2 — Universe UX + conversion architecture** ✅: every
   `site.ts` nav item gained an `intent`/`intentId` pair (the actual CTA
   phrase + its `cta_click.cta` id — docs/UNIVERSE_UX.md); the homepage
   became an intention hub; `/entrenar`/`/comunidad`/`/musica`/
   `/productos`/`/shows`/`/marcas`/`/about` all gained or renamed CTAs
   to the brief's approved copy. Copy/links/tracking only — no schema,
   no new event, no visual redesign.
7. **Block 05 — Commerce/offers/conversion infrastructure** ✅: `product`
   gained `description`/`image_url`/`base_price_cents` + an extended
   `kind` taxonomy; `offer` gained the checkout abstraction
   (`checkout_provider`/`checkout_url`/`purchase_type`/`cta_label`/
   `metadata`); `resolveCheckoutDestination()` + `GET
   /api/checkout/[offerSlug]` are real, tested infrastructure (no page
   links to it yet — no product detail page exists); `getCustomerSummary()`/
   `getSubscriptionSummary()` are new read models (`GET
   /api/analytics/revenue`'s `customers`, new `GET
   /api/analytics/subscriptions`) — see docs/COMMERCE.md. Still no real
   payment provider connected (no credentials exist) — `/productos`
   still routes to lead capture, not checkout.
8. **Block 06 — Real commerce integration**: connect a real
   checkout provider (Hotmart/Stripe/Mercado Pago — whichever Cristian
   picks) by setting `offer.checkout_provider`/`checkout_url` on real
   offer rows; first writes to `orders`/`order_items` from an actual
   purchase; a real product/offer detail page with a live `CheckoutLink`.
9. **Block 07 — B2B funnels**: a real `/shows`/`/marcas` intake writing to
   `b2b_opportunity` (schema already exists, unused), stage-change
   notifications.
10. **Block 08 — Content & brand pass**: real copy, photography/video,
    motion (`gsap-web` from the skills library), once there is real content
    to animate — likely also when the Command Center's own visual pass
    (real charts, the deferred motion) happens.
11. **Later, not scheduled**: multi-user auth/accounts beyond the single
   admin login (needed before any RLS self-service policy), membership
   platform, AI coaching, mobile app, 3D — all explicitly deferred per
   Product Vision.

## 11. What was NOT implemented, on purpose (cumulative through Block 05)

- No connection to any real Supabase project — every migration/test ran
  against a disposable local/CI Postgres.
- No real analytics vendor wired — `track()` persists a subset of events
  to this app's own `interaction` table, not to GA4/Meta/PostHog/etc.
  (Block 03 explicitly kept it this way too — "NO conectar todavía
  permanentemente" any vendor.)
- No QR image generator (the `qr_source` registry exists; codes are
  inserted directly).
- No visual charts/graphs in the Command Center — the dashboard exists
  (docs/COMMAND_CENTER.md) but every number renders as a stat tile or a
  plain table, per Block 04's own "no diseño visual avanzado todavía".
- No CAC/ROAS/CPA/CPL — no real ad-spend data exists yet to compute them
  from (docs/KPI_DEFINITIONS.md).
- No multi-user authentication/accounts — Block 04 added a single shared
  admin login (docs/COMMAND_CENTER.md §2), not a `users` table; there is
  still no per-contact RLS self-service policy (would need
  `contact.auth_user_id`, which doesn't exist). `requireAnalyticsAuth()`'s
  bearer-token path is kept for non-browser callers, not as the
  dashboard's own mechanism anymore.
- No real payment/checkout integration — Block 05 built the abstraction
  (`resolveCheckoutDestination()`, `GET /api/checkout/[offerSlug]` —
  docs/COMMERCE.md) but connected zero real providers (no credentials
  exist); `orders`/`order_items`/`subscription` still have no real
  writer, so Revenue/Productos/Suscripciones in the Command Center
  render their honest empty states.
- No product/offer catalog management UI — rows are still managed by
  direct SQL/`seed.sql` (docs/COMMERCE.md).
- No revenue-by-landing or revenue-by-intent read model (docs/COMMERCE.md §6).
- No consent banner (nothing beyond functional attribution is collected
  yet — add one before any advertising pixel ships).
- No content/copy beyond structurally-correct placeholders — see Product
  Vision's own instruction not to invent commercial specifics
  (coaching pricing/benefits) that weren't provided.

**Addendum, 2026-08-25 — Google AdSense: evaluated, deliberately not
added.** Cristian asked directly; the answer is documented here per
this section's own purpose (a decision record, not just a gap list).
AdSense pays per pageview/click on ads shown *on* this site — it
structurally competes with this app's actual monetization (coaching,
shows, brand deals, subscriptions), since every visitor it distracts
toward a third-party ad is a visitor pulled away from the site's own
CTAs, for a fraction of what one real conversion is worth at this
site's price points. It would also add a new third-party
vendor/tracking script this project has repeatedly kept out (this
section's own "no real analytics vendor," `next.config.ts`'s CSP,
docs/SECURITY.md's cookie minimization) and require the consent banner
this site currently has no reason to carry. Not revisited unless the
business model itself changes to one that depends on raw pageviews
rather than conversions — it doesn't today.
