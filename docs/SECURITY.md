# SECURITY.md — security model

## Secrets

Nothing in this repo. `DATABASE_URL`, `ANALYTICS_API_TOKEN`,
`ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` (the only secrets the
app reads) are declared in `src/server/env.ts`, `server-only`-guarded,
and validated lazily (only when a route actually needs them — see
docs/DATABASE.md and docs/ARCHITECTURE.md §9). `.env.example` documents
every variable; real values live in `.env.local` (git-ignored) or the
deploy platform's env var store. `ADMIN_PASSWORD_HASH` is a hash, never
a plaintext password — see docs/COMMAND_CENTER.md §2.

## Server-only database access

Every file under `src/server/db/` starts with `import "server-only"` —
the `server-only` package makes the build fail hard if a client
component ever imports it, instead of silently bundling a connection
string (or, worse, a live `pg.Pool`) into JavaScript shipped to the
browser. There is no client-side Supabase/Postgres access anywhere in
this app; every read or write goes through a Next.js Route Handler.

## Row Level Security (RLS)

`supabase/migrations/0002_rls_policies.sql` enables RLS on every business
table. Today's actual boundary, though, is simpler than RLS: **every
write in this app uses a server-only connection string** (never a
client-supplied JWT), and Supabase's `service_role` bypasses RLS by
design — so RLS isn't what's stopping an anonymous visitor from reading
`contact` today, the fact that `contact` is never queried outside
server-only code is. RLS is enabled anyway, with **no permissive policy**
for `anon`/`authenticated` on any table except three genuinely public
ones (`social_profile`, `product`, `offer`, all `where active = true`) —
so if a service-role credential ever leaked into a client context, or a
future feature added direct client-side Supabase reads, the default is a
hard lockout, not an accidentally open table.

**Deferred, on purpose:** per-contact self-service policies (e.g. "a
logged-in contact can read their own orders") need a
`contact.auth_user_id` column linking to Supabase's `auth.users`, which
doesn't exist because there is no authentication in this block. Add both
together when the auth block lands, not before — an RLS policy with no
real login system behind it can't be tested and shouldn't be trusted.

**Why RLS policies are only testable outside Supabase via a shim**:
`0002_rls_policies.sql` uses `auth.uid()` and the `anon`/`authenticated`/
`service_role` roles Supabase provisions automatically. A plain local or
CI Postgres has neither — `scripts/db/test-auth-shim.sql` recreates just
enough of that surface (see docs/DATABASE.md) so the same policy SQL that
ships to Supabase is exercised by `contact.integration.test.ts`-style
`SET ROLE anon` checks, without ever touching a real Supabase project in
this block ("do not connect to or modify production Supabase unless
explicitly authorized").

## Input validation

Every external input goes through zod before touching application logic:
`/api/lead` (`leadSchema`), `/api/track` (`trackSchema`, constrained to
the `interaction.event_name` taxonomy). A malformed request gets a 400
with issue detail; a value that's syntactically valid but semantically
hostile (SQL metacharacters in a name, a slug that looks like an
injection attempt) is proven inert by `reference.integration.test.ts`
and `route.integration.test.ts` — every query in `src/server/db/` uses
parameterized `$1, $2, ...` placeholders, never string-interpolated SQL.

## Rate limiting

`/api/lead`'s in-memory sliding window (5 requests/minute/IP,
`src/app/api/lead/route.ts`) is a documented, intentional limitation: it
resets on redeploy and doesn't coordinate across instances. Fine for a
single-instance deploy; replace with a shared store (e.g. Upstash Redis)
before running more than one instance behind a load balancer. `/api/track`
and `/go/[slug]` are not rate-limited in this block — they only ever
write a single `interaction` row per call, and abuse there produces noisy
analytics, not a resource or data-integrity risk the way spamming leads
would. Revisit if that changes.

## Admin authentication (Block 04 — Command Center)

`/admin/*` is a single-admin login, not a users table — full rationale,
session mechanics, and route-protection layers in docs/COMMAND_CENTER.md
§2. Summary: `ADMIN_PASSWORD_HASH` (scrypt, never plaintext) gates
`/admin/login`; a signed, stateless session cookie (`cb_admin_session`,
`ADMIN_SESSION_SECRET`) gates everything else, checked both optimistically
in `src/proxy.ts` (redirect, no DB read) and authoritatively in
`requireAdminSession()` (`src/server/auth/adminAuth.ts`, called by every
protected Server Component) — Proxy alone is never the only check, per
the Next.js Authentication guide's own recommendation. Login attempts
are rate-limited (5/IP/minute, same in-memory-Map pattern and limitation
as `/api/lead`'s). Fails closed: unset `ADMIN_PASSWORD_HASH`/
`ADMIN_SESSION_SECRET` means login always reports "not configured", never
silently open.

## Analytics endpoint authorization

`/api/analytics/*` (Block 03 — docs/REPORTING.md) exposes business
aggregates (visitor counts, lead volume, revenue) that must not be
public. `requireAnalyticsAuth()` (`src/server/analytics/auth.ts`) now
accepts either of two credentials (docs/COMMAND_CENTER.md §2): the admin
session cookie above (what the Command Center dashboard itself uses —
the browser never handles a bearer token), or a shared-secret bearer
token (`ANALYTICS_API_TOKEN`, Block 03's original mechanism) for a
future non-browser caller. **Fails closed**: if *neither* is configured,
every request gets `503`, never an open table (verified by
`overview/route.integration.test.ts`, which also asserts no `contact`
PII — email, name, phone — ever appears in a response body, not just
that the TypeScript return types omit it). Both credentials are
deliberately minimal-scope: replace the bearer-token path, and extend
the session mechanism, once real multi-user accounts exist
(docs/DATA_MODEL.md, "Explicitly not modeled yet" / docs/COMMAND_CENTER.md
§2, "How this evolves later").

These endpoints are read-only and gated by one of the two credentials
above, so they carry no separate rate limit — the credential itself is
the access control; add one if this ever needs to tolerate a leaked
token/session gracefully rather than just being rotated.

## HTTP headers

`next.config.ts` sets `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy`, and a baseline
`Content-Security-Policy` on every route (unchanged from Block 01 — see
docs/ARCHITECTURE.md §9 for the CSP's known `unsafe-inline` allowances
and when to tighten them).

## Cookies

`cb_visitor`, `cb_attr_first`, `cb_attr_last` are all `httpOnly` (no
client JS reads them) and carry only campaign labels the visitor's own
URL/referrer already exposed — no fingerprinting, no third-party id. See
docs/ATTRIBUTION.md for what each one stores. No consent banner exists
yet because nothing collected today is an advertising cookie; add one
before any third-party pixel ships (Block 01 decision, still true).

## Data minimization

`contact` only stores what a form or checkout explicitly provided — no
enrichment, no third-party identity resolution. `visitor` rows for
never-identified anonymous traffic hold no PII at all, only attribution
labels and an opaque UUID.
