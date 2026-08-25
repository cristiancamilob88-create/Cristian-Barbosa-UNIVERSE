# COMMAND_CENTER.md — Block 04: admin auth + the Command Center dashboard

The first functional version of Cristian's private business dashboard —
**DATA → API → AUTH → DASHBOARD**, per the block's own framing. Everything
under `src/server/analytics/` and every `/api/analytics/*` endpoint is
Block 03, unchanged; this block adds exactly two things on top: a minimal
admin login, and a dashboard that consumes the existing API. No read
model was duplicated, no new analytics layer was created, no SQL was
written in a React component.

```
Postgres
  ↓
analytics read models        (src/server/analytics/*.ts — Block 03, untouched)
  ↓
analytics API                (src/app/api/analytics/*.ts — Block 03, auth extended)
  ↓
authenticated dashboard      (src/app/admin/(dashboard)/* — Block 04, new)
  ↓
UI                           (src/components/admin/* — Block 04, new)
```

## 1. Audit — what Block 04 found and reused

Before writing any code: read docs/ARCHITECTURE.md, docs/DATA_MODEL.md,
docs/ANALYTICS.md, docs/ANALYTICS_ENGINE.md, docs/KPI_DEFINITIONS.md,
docs/ATTRIBUTION.md, docs/AUDIENCE_JOURNEY.md, docs/SECURITY.md, AGENTS.md,
and every file under `src/server/analytics/` and `src/app/api/analytics/`.

Findings:

- **8 endpoints already exist** (`overview`, `sources`, `campaigns`, `qr`,
  `landings`, `products`, `funnel`, `revenue`), each backed by a read
  model in `src/server/analytics/`, each behind `resolveAnalyticsRequest()`
  → `requireAnalyticsAuth()`. Nothing here needed rebuilding.
- **No auth beyond a shared bearer token** (`ANALYTICS_API_TOKEN`,
  `src/server/analytics/auth.ts`) — documented in docs/SECURITY.md as
  explicitly a placeholder: "replace it with a real role/permission
  check once the auth block exists... a bearer token with no expiry or
  per-caller identity isn't meant to be the permanent answer." Block 04
  is that block, scoped down to what a single admin actually needs.
  See §2.
- **No `/admin` or `/dashboard` route, no auth of any kind on any page** —
  greenfield for this block.
- **Date-range handling already centralized**
  (`src/server/analytics/dateRange.ts`, `?range=`/`?from=&to=`) — reused
  exactly as-is; the dashboard's `DateRangeControl` writes the same URL
  params the API already parses, so there is exactly one date-range
  implementation end to end, not two.
- **No dedicated "social" or "medium" performance endpoint** — social
  data lives inside `overview`'s response; `medium` isn't a
  `getPerformanceByDimension()` dimension (only `source`/`campaign`/`qr`
  are). Both are documented decisions, not oversights — see §13.

Plan (executed in this order): admin auth primitives → route protection
(Proxy + analytics auth) → the protected `/admin` route tree → ten
section pages, each a thin consumer of one existing endpoint → tests →
docs.

## 2. Authentication model

**One admin, one shared password — not a users table.** Cristian is the
only person this dashboard is for; a `users`/`accounts` schema, password
reset flows, and role management would all be schema and code for a
concept ("multiple distinct identities") this system doesn't have yet.
docs/SECURITY.md already named the eventual answer ("a real
role/permission check once the auth block... exists") — this is the
minimal version of that, built to be replaced rather than extended
indefinitely: swapping the single `ADMIN_PASSWORD_HASH` check in
`attemptLogin()` (`src/server/auth/loginFlow.ts`) for a real users-table
lookup is a contained, one-function change; everything downstream
(session cookie, Proxy gate, `requireAdminSession()`,
`requireAnalyticsAuth()`) already speaks in terms of "is there a valid
session", not "is there a valid password", so none of it needs to change
when real accounts land.

### Credential storage

`ADMIN_PASSWORD_HASH` — never a plaintext password, never in this repo.
Format: `scrypt:<saltHex>:<hashHex>` (`src/server/auth/password.ts`),
generated with `node scripts/admin/hash-password.mjs` and pasted into
`.env.local` (or the deploy platform's env var store) by hand. `scrypt`
is Node's built-in memory-hard KDF — no new dependency for one password
check, same threat-model category as bcrypt/argon2.

### Session

`ADMIN_SESSION_SECRET` signs a stateless session token
(`src/server/auth/session.ts`) — not a database session. Shape:
`base64url(JSON payload).base64url(HMAC-SHA256 signature)`, the same
idea as a JWT without pulling in a JWT library for one fixed claim
shape. Payload is `{ sub: "admin", iat, exp }` — no PII, nothing useful
to an attacker beyond "is this currently a valid admin session". TTL is
a fixed 12 hours from issuance; no silent refresh-on-activity (kept
simple on purpose — re-login after 12h is an acceptable cost for a
single daily user, and a fixed TTL is much easier to reason about than a
sliding one).

**Why a stateless session, not a `session` table:** a DB session would
mean a schema migration, a cleanup job for expired rows, and a query on
every request — for exactly one possible session at a time. The signed
cookie already gets revocation (rotate `ADMIN_SESSION_SECRET` to
invalidate every outstanding session at once) and expiry (`exp` in the
payload) without any of that. Revisit when there's more than one admin
and "log out every device but this one" becomes a real requirement.

### Login flow

1. `GET /admin/login` renders a password-only form (`src/app/admin/login/`).
2. Submitting calls the Server Action `loginAction` (Next.js's own
   recommended auth pattern — see `node_modules/next/dist/docs/.../authentication.md`,
   "Sign-up and login functionality" — the password never touches
   client JS).
3. `loginAction` is a thin wrapper: extract `ip` (`headers()`) and
   `password` (the `FormData`), then call `attemptLogin()`
   (`src/server/auth/loginFlow.ts`) — a **plain, unit-tested function**
   with no Next-specific API calls. **Why the split:** `next/headers`'s
   `cookies()`/`headers()` throw "called outside a request scope"
   anywhere but a real Next.js request — confirmed empirically while
   building this block — which would make `loginAction` itself
   impossible to unit test. `attemptLogin()` holds every actual
   decision (is the login system configured? rate limited? is the
   password correct?) and is fully covered by
   `src/server/auth/loginFlow.test.ts`; `loginAction` only does the
   Next-specific I/O once `attemptLogin()` has already decided, so it
   has no test of its own — verified instead by the manual dev-server
   walkthrough in §16.
4. On success: `cookies().set("cb_admin_session", token, {...})`
   (httpOnly, `secure` in production, `sameSite: "lax"`, 12h `maxAge`),
   then `redirect("/admin")`.
5. On failure: the form re-renders with a Spanish error message — never
   which part was wrong beyond "incorrect password" (single credential,
   no username to enumerate).

### Rate limiting

`src/server/auth/loginRateLimit.ts` — same in-memory sliding-window
pattern as `/api/lead`'s (`src/app/api/lead/route.ts`), tightened to 5
attempts/IP/minute (a shared admin password is a much higher-value
brute-force target than a contact form). Same documented limitation:
resets on redeploy, doesn't coordinate across instances — acceptable for
a single-instance deploy with one legitimate user, revisit before
scaling out (see docs/SECURITY.md, "Rate limiting").

### Route protection — two layers, on purpose

1. **Optimistic** (`src/proxy.ts`): before any `/admin/*` page renders,
   Proxy reads the `cb_admin_session` cookie and verifies it —
   signature + expiry only, no database read (Proxy "is not intended
   for slow data fetching" — Next.js docs, "Proxy"). Redirects an
   unauthenticated visitor to `/admin/login`, and redirects an
   already-logged-in admin away from `/admin/login` back to `/admin`.
2. **Secure** (`src/server/auth/adminAuth.ts`'s `requireAdminSession()`):
   the `(dashboard)` route group's `layout.tsx` calls this before
   rendering anything. Next.js's own Authentication guide is explicit
   that Proxy "should not be your only line of defense" — this is the
   real gate every protected Server Component sits behind, not a
   redundant check.

Both layers call the exact same underlying verification
(`isValidAdminSessionToken()`, `src/server/auth/session.ts`) — there is
one implementation of "is this session valid", called from two places
for two different reasons (fast redirect vs. authoritative gate), never
two implementations that could drift.

### Analytics endpoint authorization (extended, not replaced)

`requireAnalyticsAuth()` (`src/server/analytics/auth.ts`, Block 03) now
accepts **either** credential, checked in this order:

1. A valid `cb_admin_session` cookie — what the dashboard's own
   `fetch()` calls send automatically (same-origin, httpOnly; the
   browser attaches it, the client JS never touches it).
2. `Authorization: Bearer <ANALYTICS_API_TOKEN>` — Block 03's original
   mechanism, kept as a second, optional path for a future
   service-to-service/automation caller that isn't a logged-in browser
   session.

Fails closed exactly as before: if **neither** credential is configured
at all, every request is `503`, never open by default. A configured but
wrong/expired credential is `401`. This is the literal answer to the
brief's "reemplazar la dependencia conceptual de ANALYTICS_API_TOKEN
como mecanismo permanente de acceso al dashboard": the dashboard no
longer needs anyone to know or paste a bearer token — the token still
exists for a different, non-browser use case.

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | `/admin/login` to accept any password | `scrypt:salt:hash`, generate via `node scripts/admin/hash-password.mjs`. Unset → login always reports "not configured". |
| `ADMIN_SESSION_SECRET` | Session cookie signing, and the dashboard's own path into `/api/analytics/*` | ≥32 chars, `openssl rand -hex 32`. Unset → `/admin/*` and the session-cookie path both fail closed. |
| `ANALYTICS_API_TOKEN` | Non-browser callers of `/api/analytics/*` (unchanged from Block 03) | Optional; the dashboard itself no longer needs it. |

### Known risks

- Single shared credential: if `ADMIN_PASSWORD_HASH`/`ADMIN_SESSION_SECRET`
  ever leak, there is no per-user audit trail or selective revocation —
  rotate both and every session invalidates at once. Acceptable for one
  legitimate user; revisit before a second admin exists.
- In-memory login rate limiting doesn't survive a redeploy or coordinate
  across instances — same documented limitation as `/api/lead`.
- No password reset flow — a lost password means regenerating
  `ADMIN_PASSWORD_HASH` via the script and updating the env var by hand.
  Acceptable for one admin with direct deploy access.

### How this evolves later

When real multi-user accounts land (docs/DATA_MODEL.md, "Explicitly not
modeled yet" — needs `contact.auth_user_id`): replace `attemptLogin()`'s
single-hash comparison with a real users-table lookup, keep the same
signed-session shape (or move to Supabase Auth's own session handling),
and the Proxy gate / `requireAdminSession()` / `requireAnalyticsAuth()`
call sites don't need to change — they already only depend on "is there
a valid session", not on how that session was established.

## 3. Routes

`/admin` was chosen over `/dashboard` — shorter, and "Command Center" is
the block's own name for this surface. `src/config/site.ts`'s
`navItems`/`secondaryNavItems` are still untouched — those drive the
homepage pillar grid and require a commercial `intent` phrase, which a
login link isn't. **Updated 2026-08-25**, at Cristian's own request (he
uses `/admin` as a real day-to-day tool now and needs a findable way
back in): a small, muted `Link` to `/admin/login` sits in `Footer.tsx`,
same visual tier as the copyright line — visible on every page, but
not a `TrackedLink` (per PageViewTracker.tsx, `/admin` traffic is
excluded from analytics on purpose) and not competing with any real
CTA. The password is still the only actual gate — this only changes
whether a legitimate admin can find the door, not who can open it.

```
/admin/login              public — the only unprotected page under /admin
/admin                    Overview (Section 1)
/admin/fuentes            Adquisición: source + campaign (Section 2)
/admin/social             Social routing (Section 3)
/admin/qr                 QR performance (Section 4)
/admin/landings           Landing performance (Section 5)
/admin/funnel             Funnel (Section 6)
/admin/leads              Leads (Section 7)
/admin/productos          Products/offers (Section 8)
/admin/revenue            Revenue (Section 9)
/admin/canales            Channel comparison (FASE 10)
```

`src/app/admin/login/` sits outside the `(dashboard)` route group, so
its `layout.tsx` (which calls `requireAdminSession()`) never wraps the
login page itself — no redirect loop is architecturally possible.
`/admin/logout` is not a route; logging out is a Server Action
(`src/app/admin/(dashboard)/actions.ts`'s `logoutAction`) invoked from a
`<form>` in `AdminNav`.

## 4. What each section consumes

No page queries Postgres or imports anything from `src/server/db/` or
`src/server/analytics/` — every one calls `fetchAnalytics()`
(`src/lib/adminAnalytics.ts`) against an existing endpoint.

| Page | Endpoint(s) |
|---|---|
| Overview | `GET /api/analytics/overview` (KPIs, `timeseries`, "vs. período anterior" via a second call to the same endpoint — Block 04.1) |
| Fuentes | `GET /api/analytics/sources`, `GET /api/analytics/campaigns`, `GET /api/analytics/medium` (Block 04.1) |
| Social | `GET /api/analytics/overview` (its `social` field) |
| QR | `GET /api/analytics/qr` |
| Landings | `GET /api/analytics/landings` |
| Funnel | `GET /api/analytics/funnel?preset=...` |
| Leads | `GET /api/analytics/leads` (Block 04.1 — real recent-activity list) + `GET /api/analytics/overview` (KPI + leads-by-interest) + `sources`/`campaigns` (their `leads` column) |
| Productos | `GET /api/analytics/products` |
| Revenue | `GET /api/analytics/revenue?attribution=...` |
| Canales | `GET /api/analytics/sources` |

### Endpoints used, and why not more

The brief names 8 endpoints; Block 04 adds none. Two sections
deliberately reuse an existing response instead of asking for a new
route:

- **Social** has no dedicated `/api/analytics/social` — `getSocialPerformance()`
  already has a home inside `overview`'s response (it was bundled there
  in Block 03 specifically because "there's no natural 'interest' or
  'social' top-level route among the eight the brief names" —
  `src/app/api/analytics/overview/route.ts`). Adding a ninth endpoint
  for data that already ships would be exactly the "no duplicar
  analytics" this block was told not to do.
- **Canales** (channel comparison) reuses `sources` — `source` *is* the
  channel dimension (Instagram/Facebook/TikTok/YouTube/WhatsApp/Google/
  Evento/QR/Referral/Direct all live as rows of the same `source`
  dictionary table).

### What's not built (by design, not oversight)

- **No `medium` performance table as of Block 04, built in Block 04.1** —
  see docs/ANALYTICS_ENGINE.md, "Segmentation", for how
  `getPerformanceByDimension()` grew a fourth, no-dictionary case.
- **No sessions/landing-views/CTA-clicks broken down by channel** on the
  Canales page — only visitors/leads/purchases/revenue exist per
  dimension today (same read model as Fuentes). The Canales table is
  exactly where CAC/ROAS/CPA/CPL columns will attach once a real ad
  platform is connected — not built now, per the brief's own
  instruction ("no calcular CAC/ROAS... no hay gasto publicitario real
  conectado").

## 5. KPIs and read models

Every number in Overview/Leads/Revenue is read verbatim from the API —
no formula is recomputed client-side. The two exceptions, both
documented at their call site:

- **QR conversion rate** (`/admin/qr`) and **landing conversion rate**
  (`/admin/landings`) are `leads / visits` and `leadConversions /
  uniqueVisitors` respectively — the identical Visitor→Lead formula
  docs/KPI_DEFINITIONS.md already defines, applied to numbers the API
  already returned (not a new aggregation, not a new metric — a single
  division in the presentation layer, the same category of arithmetic
  as `formatRatio()` itself).

Every other ratio (Visitor→Lead, Landing→Lead, Lead→Purchase,
Visitor→Purchase, CTA→Lead, Checkout→Purchase) comes straight from
`AnalyticsOverview.ratios` (docs/KPI_DEFINITIONS.md) — this dashboard
invents nothing.

## 6. Date filters

One control, `src/components/admin/DateRangeControl.tsx` — writes
`range` (today/7d/30d/90d) or `from`/`to` into the URL's own search
params. `useAnalyticsQuery()` (`src/components/admin/useAnalyticsQuery.ts`)
reads those same params and passes them straight to `fetchAnalytics()`,
which builds the exact `?range=`/`?from=&to=` query string
`src/server/analytics/dateRange.ts` already parses. One implementation,
both ends — no page computes a date range itself.

## 7. Segmentation

Two controls exist for the dimensions the brief calls out as needing
one: `FunnelPresetControl` (which `PRESET_FUNNELS` entry) and
`AttributionControl` (first-touch vs. last-touch on Revenue). Source/
campaign/medium/route/interest/product/offer filtering was explicitly
scoped as "preparar pero no sobre-construir" — the read models already
group by every one of those dimensions server-side (that's what the
performance tables *are*); a cross-cutting filter UI on top is left for
whichever future block needs to slice one specific table by another
dimension, rather than building a generic filter framework speculatively.

## 8. Loading, empty, and error states

`src/components/admin/AnalyticsBoundary.tsx` wraps every section's
fetch: `LoadingBlock` while in flight, `ErrorBlock` (message from the
API or a generic fallback) on a failed/rejected request, `EmptyBlock`
when a page's own `isEmpty()` predicate says so (e.g. "no leads in this
range" / "no purchases yet"). One implementation, not copy-pasted across
ten pages. Revenue and Products additionally render an explicit "Sin
ventas registradas todavía." message when `orders` has no paid rows in
range — never a chart or number implying revenue that doesn't exist.

**Real bug found and fixed, 2026-08-25**: 8 of the 10 sections (every
one except Funnel and Revenue) rendered `<AnalyticsBoundary>{(data) =>
...}</AnalyticsBoundary>` directly inside their `page.tsx` Server
Component. That's invalid — React Server Components cannot pass a
function as a prop to a Client Component (`AnalyticsBoundary` is one,
`"use client"`, since it calls `useAnalyticsQuery`), and a render-prop's
`children` *is* a function. `npm run build`/`next dev` never caught
this because the affected routes are dynamic (`ƒ`), so build-time static
generation never actually renders them — the crash only fires at
request time in production (`next start`/Vercel), confirmed by
reproducing it on the already-deployed code before this fix, not
assumed. Funnel and Revenue were accidentally correct: both needed
`useState` for a preset/attribution toggle, which had already forced
their content into a separate `"use client"` file
(`FunnelPageContent.tsx`/`RevenuePageContent.tsx`), sidestepping the
issue by construction. Fix: every section now follows that same split —
`page.tsx` stays a Server Component holding only `metadata` and
`SectionHeader`; a new `{Section}PageContent.tsx` (`"use client"`) holds
the `AnalyticsBoundary` usage and everything data-dependent. Same
pattern everywhere now, not two different ones.

## 9. Responsive

No table has a fixed width — `src/components/admin/Table.tsx` scrolls
horizontally inside its own container (`overflow-x-auto`) instead of
squeezing columns unreadably on a phone (Cristian's stated primary
device). `AdminNav` scrolls horizontally too on narrow viewports. Stat
tile grids collapse from 5/6 columns down to 2 via Tailwind's responsive
grid utilities — no separate mobile layout to maintain.

## 10. Design

Reuses the existing token system verbatim (`src/app/globals.css`):
`ink`/`chalk`/`ember`/`steel` colors, Big Shoulders (headings)/Inter
(body)/JetBrains Mono (labels, data tags) — the same fonts and palette
`docs/ARCHITECTURE.md` §8 already committed to. No 3D, no WebGL, no
animation library, no chart library — bars in `FunnelBars` are plain
`<div>`s with a CSS `width`, per the block's own "no diseño visual
avanzado todavía" instruction.

**Full Spanish pass, 2026-08-25** (Cristian's own request — "no entiendo
bien" citing "Lead" specifically): the dashboard had drifted into a
mix of Spanish labels and untranslated English jargon — nav items
(Overview/Landings/Funnel/Leads/Revenue), several StatTile labels
(Page views/CTA clicks/WhatsApp clicks/...), table headers (Views/
Scans/Revenue/...), the funnel step names, and the first-touch/
last-touch toggle. Every user-visible string across all 10 sections is
Spanish now — verified by walking the rendered DOM text (not just
grepping source) after a real production build, confirming zero English
words remain visible. Glossary used, for consistency across future
sections: **Lead → Registro** (deliberately not "Contacto" — that word is
reserved for a future, separate, PII-bearing page; see
docs/ANALYTICS_ENGINE.md, "Recent-leads list", for why `getRecentLeads()`
itself never exposes name/email), **Revenue → Ingresos**, **Landing
(views) → Visitas con origen**, **CTA click → Clic en CTA**. Internal
code (variable/component/type names, docs, event taxonomy strings in
`interaction.event_name`) stays as-is — only what a person actually
reads on screen changed.

## 11. Performance and privacy

- Every `/admin/*` page is dynamically rendered (the `(dashboard)`
  layout's `cookies()` call forces it) — nothing here is statically
  generated at build time with stale data baked in.
- Client fetches use `cache: "no-store"` — Cristian's own live business
  numbers, never served from the browser's HTTP cache.
- `PageViewTracker` (`src/components/analytics/PageViewTracker.tsx`)
  now skips `/admin/*` — Cristian's own dashboard usage doesn't pollute
  his own traffic analytics.
- No CRM PII (email/phone/name) is ever rendered anywhere under
  `/admin` — every page renders only what its endpoint returns, and
  every endpoint's own response shape (docs/REPORTING.md) has never
  included PII (verified again by `overview/route.integration.test.ts`'s
  no-PII-leak assertions, unchanged from Block 03).
- Builds cleanly with or without `DATABASE_URL`/`ADMIN_*` set (lazy env
  validation, unchanged pattern from `src/server/env.ts`).

## 12. Testing

**Unit (no DB):**

- `src/server/auth/session.test.ts` — token issuance/verification:
  valid, expired, wrong secret, tampered signature, malformed input,
  `isValidAdminSessionToken()`'s fail-closed behavior.
- `src/server/auth/password.test.ts` — hash format, salt uniqueness,
  correct/incorrect password, malformed stored values.
- `src/server/auth/loginFlow.test.ts` — `attemptLogin()`: not
  configured, correct/incorrect password, rate limiting (and that it's
  per-IP, not global), non-string input.
- `src/server/analytics/auth.test.ts` — `requireAnalyticsAuth()`: fails
  closed with neither credential configured; accepts a valid session
  cookie; accepts a valid bearer token; falls back from an
  expired/invalid session to a valid bearer token; rejects a
  foreign-secret session.
- `src/proxy.test.ts` — the Proxy admin gate: redirects unauthenticated
  visitors (root and nested `/admin/*` paths) to `/admin/login`;
  redirects an expired session the same way; lets a valid session
  through with no redirect; lets an unauthenticated visitor reach
  `/admin/login` itself (no redirect loop); redirects an already-logged-in
  admin away from `/admin/login`; leaves unrelated public routes and the
  existing visitor-cookie assignment untouched.
- `src/lib/format.test.ts` — currency/integer/ratio formatting,
  including that `null`/`undefined` render as "—", never a fabricated 0%.

**Integration (DB-backed):** `overview/route.integration.test.ts`
(Block 03, extended) gained one test asserting the admin session cookie
alone — no bearer token, no `Authorization` header — is sufficient to
reach a real route handler successfully. Every pre-existing Block
01–03 test in this file and every other integration test file was
re-run and still passes unmodified.

**Manual validation** (dev server, real login flow, `curl` + a
manually-signed token for the deeper walkthrough since Server Actions'
`cookies()`/`headers()` can't run outside a live request — see §2,
"Login flow" — for why `loginAction` has no automated test of its own):
unauthenticated `GET /admin` → `307` to `/admin/login`; wrong password →
error message, no cookie set, no redirect; correct password → redirected
to `/admin`; `/admin`, `/admin/qr`, `/admin/funnel`, `/admin/revenue` all
render their real heading server-side and return `200`; `GET
/api/analytics/overview` with the session cookie → `200` with the
correct KPI JSON shape; the same request with no credential at all →
`401` (both `ANALYTICS_API_TOKEN` and `ADMIN_SESSION_SECRET` were
configured during this walkthrough, so `503`'s fail-closed path is
covered by the automated test instead, where the env is fully
controlled).

## 13. Decisions worth naming explicitly

- **Client components fetch the existing HTTP API, not the read models
  directly.** A Server Component *could* call `getAnalyticsOverview()`
  in-process and skip the network hop — but the brief is explicit ("El
  dashboard debe consumir los endpoints analytics existentes"), and
  fetching over HTTP means the auth boundary (`requireAnalyticsAuth()`)
  is exercised on every real request, not just simulated in tests.
- **Client-side data fetching, not Server Component data fetching**, for
  every section body. This is what makes the date-range/preset/
  attribution controls interactive without a full page reload, and it
  keeps every page's data-fetching identical (`useAnalyticsQuery()`)
  regardless of how many controls a given section has.
- **Why the client types in `src/lib/adminAnalytics.ts` are duplicated,
  not imported from `src/server/analytics/*`:** those modules import
  `server-only`; even a type-only import can be made to work via
  TypeScript's `import type` erasure, but hand-keeping a small DTO
  layer here means the browser-facing contract is never accidentally
  widened by a change to an internal server type, and it matches the
  existing `src/types/crm.ts` precedent of application-facing types
  living apart from the DB/repository layer.
- **Ten pages, not one page with tabs fetching everything eagerly** —
  each section only fetches what it renders, so switching sections
  doesn't pay for the other nine endpoints.

## 14. What was NOT implemented, on purpose

Per the brief's own "NO HACER" list, unchanged and still true after this
block: no 3D, no WebGL, no heavy/complex animation, no charting library,
no real checkout/payment integration, no Hotmart/Meta/TikTok/Google Ads
API connections, no email/WhatsApp automation, no full multi-user
authentication (see §2), no CAC/ROAS/CPA/CPL (no real ad spend data
exists), no production Supabase connection. Also not built, specific to
this block: sessions/CTA-clicks broken down by channel (§4), a generic
cross-dimension filter framework (§7), password reset / multi-admin
support (§2). (`medium` performance was added in Block 04.1 — §16.)

## 15. Recommendation after Block 04

The data engine (Block 03) and the admin surface to view it (Block 04)
are both solid and tested. The natural next step is visual refinement of
this same dashboard (real charts where a table currently is, the
deferred motion/interaction pass) now that the data plumbing is proven —
or, if commerce is higher priority, wiring a real `orders` write path so
Revenue/Productos stop rendering their (correct, honest) empty states.
Either way, `requireAdminSession()`/`requireAnalyticsAuth()` are already
the right place to add role checks if a second admin identity is ever
needed before then. (Block 04.1, below, took the first of these two
paths.)

## 16. Block 04.1 — visual/data layer

The MVP dashboard (§§1–15) was functional but minimal — one table per
section, no trend, no comparison, no medium breakdown, and a leads
section that could say "how many" but not "which ones, recently."
Block 04.1 closes those gaps using only the `dataviz` skill's method
(form → color → validate → marks → interaction → accessibility) and
the same `ink`/`chalk`/`ember`/`steel` tokens as everywhere else in the
app — no charting library, no new design system.

### What changed

- **Evolución temporal** (Overview): `GET /api/analytics/overview` gained
  a `timeseries` field (`getDailySeries()`,
  `src/server/analytics/timeseries.ts` — a new read model, day-bucketed,
  zero-filled) rendered by `Sparkline` (`src/components/admin/Sparkline.tsx`),
  a plain inline-SVG line — one hue (ember, the brand's single accent),
  since a sparkline is always exactly one series (dataviz: "sequential =
  one hue"). Interaction is native `<title>` tooltips per point, not a
  custom crosshair overlay — proportionate to this block's own "motion
  sutil, no 3D/animación avanzada" scope note.
- **Comparaciones temporales**: `OverviewComparison`
  (`src/app/admin/(dashboard)/OverviewComparison.tsx`) fetches the exact
  same `overview` endpoint a second time for the immediately-preceding,
  equal-length window (`previousRangeOf()`, `src/lib/adminAnalytics.ts`
  — pure, client-side, no backend change) and renders a `DeltaBadge`
  next to each of the four headline tiles (Visitantes/Leads/Compras/
  Revenue). A zero previous-period value renders "Nuevo", never a
  fabricated ∞% or 0%.
- **Performance por medium** (`/admin/fuentes`): `getPerformanceByDimension()`
  grew a fourth dimension, `medium` — free text, no dictionary join (see
  docs/ANALYTICS_ENGINE.md, "Segmentation") — behind a new, minimal
  `GET /api/analytics/medium` (mirrors `sources`/`campaigns` exactly).
- **Leads — actividad reciente** (`/admin/leads`): a genuinely new read
  model, `getRecentLeads()` (`src/server/analytics/leads.ts`) — the one
  place in this codebase returning individual rows instead of an
  aggregate, behind a new `GET /api/analytics/leads`. Still no PII (see
  docs/ANALYTICS_ENGINE.md, "Recent-leads list").
- **Scannable performance tables**: `PerformanceTable` gained an inline
  `MiniBar` (`src/components/admin/MiniBar.tsx`) on its Visitantes and
  Revenue columns — a magnitude bar collapsed into the cell it already
  had, one neutral hue (steel), relative to that table's own max value.
- **Funnel drop-off**: `FunnelBars` now marks the single step with the
  worst step-over-step conversion in rust (the palette's existing
  "pressed/negative" tone) instead of requiring the reader to compare
  every percentage by hand — directly answers "¿qué punto del funnel
  pierde usuarios?".

### Decisions worth naming

- **No categorical palette validation was needed.** Every new visual is
  single-series (Sparkline, MiniBar) or a two-state highlight
  (FunnelBars' worst-drop marking) — the dataviz skill's six-check
  categorical validator applies to multi-series color assignment, which
  this dashboard still doesn't have (see §10's original "Design"
  rationale: ink/chalk/ember/steel is a monochrome-plus-one-accent
  brand, not a multi-hue categorical system).
- **"Vs. período anterior" reuses the existing endpoint** rather than
  adding a `?compare=true` server-side parameter — computing the
  previous window is a pure, one-line function, and a second HTTP call
  costs nothing meaningful at this traffic scale. Revisit only if
  profiling ever shows otherwise.
- **`getRecentLeads()` breaks the "every read model is an aggregate"
  pattern on purpose** — see docs/ANALYTICS_ENGINE.md for the full
  reasoning; it's the one place a raw, PII-free row list earns its
  place over a rollup.

### What's still not built

- **Journey de usuario/contacto** — `getContactJourney()`/`getVisitorJourney()`
  (Block 03) have no endpoint or page yet. Deferred because a real
  journey view legitimately wants an identifier to look up (which
  contact?), and building that lookup UI/endpoint well is a sized
  feature on its own — not squeezed into this pass. Recommended as a
  focused follow-up, likely paired with the "full contact detail"
  admin-only surface named in §4/docs/ANALYTICS_ENGINE.md ("Recent-leads
  list") rather than bolted onto `/api/analytics/*`.
- **Sessions in the time series** — see docs/ANALYTICS_ENGINE.md, "Time
  series", for why.
- Real charts (bar/area beyond a sparkline and a mini-bar), micro-
  interactions, and any further motion are still deliberately deferred
  to a later visual-polish block, per this block's own "no 3D/animación
  avanzada" scope note.
