# ARCHITECTURE.md — Cristian Barbosa Universe

Technical architecture for the digital core of the Cristian Barbosa personal
brand ecosystem. This document is the record of **Block 01 — Repository
Audit + Technical Foundation** and the reference for every block after it.

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
| Testing | **Vitest** | Fast, zero-config for a Next+TS project, no jsdom needed yet since only `lib/` pure functions are tested. |
| Deployment target | **Vercel** (recommended, not yet wired) | Native Next.js support (Edge Middleware, ISR, image optimization), first-party env var management per environment, zero-config preview deployments per PR — the least operational overhead for a single Next app. No account/project was created in this block; this is a documented decision, not an implemented integration. |

## 3. Folder structure

```
src/
  app/                    routes — one folder per pillar, App Router convention
    entrenar/ comunidad/ musica/ productos/ shows/ marcas/ eventos/ about/ contacto/
    api/lead/route.ts     lead intake endpoint (validation + rate limit, no DB yet)
    layout.tsx            shared shell: fonts, <Header/>, <Footer/>, Person JSON-LD
    sitemap.ts robots.ts  SEO file conventions
  components/
    layout/               Header, Footer, PageHero (shared route hero shell)
    ui/                   Container, TrackedLink (analytics-instrumented link)
    forms/                ContactForm (client component)
  lib/
    attribution.ts         UTM/QR/referral parsing — pure functions, unit tested
    analytics.ts            event taxonomy + pluggable sink
    seo.ts                   per-route Metadata builder
    env.ts                   validated env access
  proxy.ts                  edge attribution capture (first-touch/last-touch cookies)
  types/crm.ts              conceptual CRM entities (types only, no DB)
  config/site.ts             nav items, brand copy, social links — single source of truth
docs/                       this file + DATA_MODEL, ANALYTICS, ROADMAP
```

Rationale: routes stay thin (hero + a data-driven grid), shared logic lives
in `lib/`, and `config/site.ts` is the one place a new route or nav label
gets added — nothing else hardcodes the route list (nav, footer, sitemap
all read from it).

## 4. Data strategy (proposed, not implemented)

**Decision: Postgres via Supabase**, when a data layer block is
authorized. Reasoning, weighed against the CRM's actual shape (Section 5):

- The CRM model is relational (a Contact has many Interactions, Interests,
  Orders) — a document store would just reinvent joins in application code.
- Supabase bundles Postgres + Auth + Row Level Security + Storage, which
  matches the later roadmap items (user accounts, membership, file
  uploads for coaching) without adding a second vendor per feature.
- It already appears as researched-but-not-vendorized in the skills
  library (`docs/supabase-skills-research.md`), so tooling exists for a
  future block to draw on without starting research from zero.

**Not implemented in this block, on purpose:** no tables, no migrations,
no ORM. The instruction is explicit — propose the strategy, don't invent
the schema before it's needed. `src/types/crm.ts` is the reviewed contract
the first data-layer block will turn into real tables.

## 5. CRM strategy

See `docs/DATA_MODEL.md` for the full entity rationale. Summary: one
`Contact` accumulates many `Interest`, `Interaction`, `Lead`, `Order`, and
`Subscription` rows over time (many-to-many journey, not one row per form).
`SourceRef` (first-touch/last-touch) is embedded rather than a separate
join table, because it's written once per touch and never queried
independently of its owning record.

## 6. Analytics strategy

See `docs/ANALYTICS.md` for the event taxonomy. Summary: page code never
calls a vendor SDK directly — everything goes through `track()` in
`lib/analytics.ts`, which today only logs to the console in development.
Swapping in GA4/Meta Pixel/PostHog/a first-party `/api/events` endpoint
later is a one-file change, not a per-page rewrite.

## 7. Attribution strategy

UTM parameters, QR-driven `utm_medium=qr` visits, and referrer-based
channel classification (`organic_social`, `organic_search`, `referral`,
`direct`) are captured in `src/proxy.ts` at the edge, before any page
renders — not left to a form field to reconstruct later. Two first-party
cookies (`cb_attr_first`, `cb_attr_last`, 90-day expiry) store the same
`SourceRef` shape used in `types/crm.ts`, so a future CRM write path reads
them directly with no translation layer.

**QR campaigns**: no generator was built (not required for this block).
The architecture is: a QR image encodes a normal URL with
`utm_source`/`utm_medium=qr`/`utm_campaign` (e.g.
`/entrenar?utm_source=aura&utm_medium=qr&utm_campaign=aura-envigado`) — the
same proxy logic that handles a social click handles a QR scan, so no
QR-specific backend code is needed until someone wants dynamic
(re-pointable) QR codes, which is a real feature to design later, not a
default to build now.

**Privacy**: only first-party, non-fingerprinting data is stored (the
campaign labels already present in the visitor's own URL/referrer). No
consent banner exists yet because no cookie here is currently used for
anything beyond functional attribution — revisit before adding an
advertising pixel (see Roadmap).

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
- **Explicitly deferred**: advanced motion (GSAP/Framer choreography) and
  3D/WebGL, per Product Vision — the skills exist in the library but are
  not installed into this project yet.

## 9. Security

- **Secrets**: none in the repo. `.env.example` documents every var this
  app reads (`src/lib/env.ts`); real values live in `.env.local`
  (git-ignored) or the deploy platform's env var store.
- **Input validation**: every external input (`/api/lead`, `ContactForm`)
  is parsed through zod; invalid input never reaches application logic.
- **Form protection**: a honeypot field plus a simple in-memory sliding-
  window rate limit (5 requests/IP/minute) on `/api/lead`. Documented
  limitation: in-memory state doesn't survive a redeploy and doesn't
  coordinate across instances — fine for a single-instance foundation
  deploy, not for production scale (see Roadmap).
- **HTTP headers**: `next.config.ts` sets `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and a
  baseline `Content-Security-Policy` on every route.
- **Data minimization**: attribution cookies store only campaign labels
  already present in the URL/referrer — nothing else is collected because
  nothing else is needed yet.

## 10. Roadmap (proposed block order)

1. **Block 01 — Repository audit + technical foundation** *(this block)*.
2. **Block 02 — CRM data layer**: stand up Postgres/Supabase, turn
   `types/crm.ts` into real tables + RLS policies, wire `/api/lead` to
   persist instead of log, move attribution cookies into a
   `Contact.firstSource/lastSource` write path.
3. **Block 03 — Analytics sink + dashboard data**: pick and wire a real
   analytics vendor or first-party `/api/events` store; build the
   acquisition/conversion/revenue read models the Dashboard section of the
   brief describes (no visual dashboard yet — data first).
4. **Block 04 — Commerce**: `/productos` checkout integration(s),
   `/comunidad` Facebook Subscription linkout hardening, order/subscription
   sync into the CRM.
5. **Block 05 — B2B funnels**: `/shows` and `/marcas` lead routing,
   pipeline stages on `Lead.status`, notification/follow-up automation.
6. **Block 06 — Content & brand pass**: real copy, photography/video,
   motion (`gsap-web` from the skills library), once there is real content
   to animate.
7. **Later, not scheduled**: auth/accounts, membership platform, AI
   coaching, mobile app, 3D — all explicitly deferred per Product Vision.

## 11. What was NOT implemented in this block, on purpose

- No database, no ORM, no migrations.
- No real analytics vendor wired — `track()` only logs to console.
- No QR generator.
- No visual dashboard.
- No authentication/accounts.
- No payment/checkout integration (Facebook Subscription is linked to
  externally, not embedded).
- No consent banner (nothing beyond functional attribution is collected
  yet — add one before any advertising pixel ships).
- No content/copy beyond structurally-correct placeholders — see Product
  Vision's own instruction not to invent commercial specifics
  (coaching pricing/benefits) that weren't provided.
