# SUPABASE_PRODUCTION.md — Block 06: real Supabase, safely

**Status as of this block: no real Supabase project is connected to this
session.** No Supabase MCP connector is installed, no `DATABASE_URL` (or
any `SUPABASE_*` variable) pointing at a live project exists in this
environment, and `.env.local`/`.env*` are correctly absent from the repo
(git-ignored, per docs/SECURITY.md). Per this block's own rule 15 ("si
falta una credencial o acceso externo, NO simules la integración"),
Phases 2/3/5/7/9 of the brief (auditing the real project, applying
migrations to it, auditing its live RLS, running scenario tests against
it, verifying attribution end to end) were **not executed** — there is
nothing to point them at yet. This document is everything this block
*could* do without that access: a precise description of what a real
project needs, and exactly what to hand Claude to finish the rest. See
`docs/MANUAL_SETUP_CHECKLIST.md` for the itemized manual/automatable
split across every external service this project eventually touches,
not just Supabase.

## 1. Architecture (unchanged, confirmed still true)

This app never uses `@supabase/supabase-js` — it's plain `pg` against
Postgres (`src/server/db/pool.ts`), and Supabase is "just Postgres" for
every purpose this app has today (docs/ARCHITECTURE.md §4). Nothing
about that changes in this block, and nothing needed to change: no
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/
`SUPABASE_SERVICE_ROLE_KEY` exists in `.env.example` because the app
reads none of them. Supabase's role here is: hosted Postgres + RLS +
(unused so far) Auth/Storage, reachable through one `DATABASE_URL`.

## 2. Expected state after all migrations — the audit matrix

Compiled from `supabase/migrations/*.sql` (read in full, not inferred)
against a **clean** database. This is FASE 1's deliverable — the
expected state to diff a real project against, once reachable.

| Recurso | Migración | Propósito | Dependencias | Estado |
|---|---|---|---|---|
| `extension pgcrypto` | 0001 | `gen_random_uuid()` for every table's `id` | — | Esperado |
| `extension citext` | 0001 | Case-insensitive `contact.email` | — | Esperado |
| `function set_updated_at()` | 0001 | Shared `updated_at` trigger body | — | Esperado |
| `source` | 0001 | Extensible acquisition-source dictionary (find-or-create) | — | Esperado |
| `campaign` | 0001 | Named acquisition effort, independent of source | trigger `set_updated_at` | Esperado |
| `qr_source` | 0001 | Registered QR codes, pre-registered only | `source`, `campaign` (nullable FKs) | Esperado |
| `social_profile` | 0001 | Outbound link registry (`/redes`, `/go/*`) | trigger `set_updated_at` | Esperado |
| `interest` | 0001 | Canonical vocabulary of universe pillars | — | Esperado |
| `visitor` | 0001 | Anonymous identity + first/last-touch | `source`, `campaign`, `qr_source` (nullable FKs) | Esperado |
| `contact` | 0001 | A known person, deduped by email/phone | trigger `set_updated_at`, trigger `contact_protect_first_touch` | Esperado |
| `contact_visitor` | 0001 | Links a visitor to the contact it became | `visitor`, `contact` (cascade) | Esperado |
| `contact_interest` | 0001 | Many-to-many contact↔interest | `contact`, `interest` (cascade) | Esperado |
| `interaction` | 0001, extended 0003 | The canonical event journal | `visitor` (required), `contact`/`source`/`campaign`/`qr_source` (nullable) | Esperado |
| `lead` | 0001, extended 0004 | A qualified ask | `contact` (cascade), `interest`/`source`/`campaign`/`qr_source` (nullable) | Esperado |
| `product` | 0001, extended 0005 | Catalog asset | trigger `set_updated_at` | Esperado |
| `offer` | 0001, extended 0005 | Commercial presentation of a product | `product` (cascade), `campaign` (nullable), trigger `set_updated_at` | Esperado |
| `orders` | 0001 | Named plural (`order` is reserved) | `contact` (cascade) | Esperado |
| `order_items` | 0001 | Line items | `orders` (cascade), `offer` (restrict) | Esperado |
| `subscription` | 0001 | External subscription state | `contact` (cascade), `product` (restrict), trigger `set_updated_at` | Esperado |
| `b2b_opportunity` | 0001 | Shows/brands/sponsors pipeline | `contact` (cascade), `source`/`campaign` (nullable), trigger `set_updated_at` | Esperado |
| RLS enabled, all 17 business tables | 0002 | Deny-by-default | needs Supabase's `auth` schema/roles — see §4 | Esperado (Supabase only) |
| RLS policy `social_profile_public_read` | 0002 | Public read, `active = true` | — | Esperado |
| RLS policy `offer_public_read` | 0002 | Public read, `active = true` | — | Esperado |
| RLS policy `product_public_read` | 0002 | Public read, `active = true` | — | Esperado |
| `interaction.medium/content/term/referrer` | 0003 | Per-event attribution snapshot | — | Esperado |
| `interaction.entity_type/entity_id` | 0003 | Polymorphic reference (`product`/`offer` views) | — | Esperado |
| `interaction_event_name_check` (16 values) | 0003 | Full taxonomy (see §5) | — | Esperado |
| `interaction_entity_idx`, `interaction_medium_idx` | 0003 | Partial indexes for the above | — | Esperado |
| `lead.medium` | 0004 | Leads-by-medium without a `contact` join | — | Esperado |
| `product.description/image_url/base_price_cents` | 0005 | Catalog presentation fields | — | Esperado |
| `product_kind_check` (9 values) | 0005 | Extended category taxonomy | — | Esperado |
| `offer.checkout_provider/checkout_url/purchase_type/cta_label/metadata` | 0005 | Checkout abstraction (docs/COMMERCE.md) | — | Esperado |
| `schema_migrations` | (created by `migrate.mjs`, not a `.sql` file) | Tracks applied migration filenames | — | Esperado once `db:migrate` has run once |

**"Estado: Esperado" means "this is what a correctly-migrated database
looks like"**, verified by construction (every row above traces to a
line in a migration file this session read in full) and by running the
exact same migration files against a disposable local Postgres in this
block's Phase 12 (§8) — it is **not** a claim about any specific real
project's current state, which nobody has looked at yet (§3).

## 3. Real Supabase project — audit result

**Not performed.** No credential, connection string, or MCP connector
gave this session any way to inspect a real Supabase project's tables,
RLS, roles, or `schema_migrations` state. Rather than guess, simulate,
or skip silently, this block stops here and reports the gap — see
`docs/MANUAL_SETUP_CHECKLIST.md`, "Supabase," for exactly what to
provide so a future session can run the real Phase 2 audit (list
existing tables/columns/constraints/indexes/functions/triggers/
policies/extensions, diff against §2, and only then propose next
steps — never a blind `db:migrate` against an unaudited project).

## 4. RLS model (design, confirmed unchanged; live audit pending §3)

Deny-by-default on all 17 business tables (0002). Three tables have a
narrow, deliberate public-read policy — `social_profile`, `offer`,
`product`, all `where active = true` — everything else has **zero**
permissive policy for `anon`/`authenticated`. Every write in this app
goes through server-only Next.js Route Handlers using the connection
string in `DATABASE_URL`; if that's Supabase's `service_role`
connection (bypasses RLS by design), RLS is defense-in-depth today, not
the primary boundary — see docs/SECURITY.md for the full model,
unchanged by this block.

`0002_rls_policies.sql` needs Supabase's `auth` schema and
`anon`/`authenticated`/`service_role` roles, which only a real Supabase
project (or the local-only `test-auth-shim.sql`) provisions — this is
why it's the one migration that cannot be verified against a plain
local Postgres without that shim, and why local `npm run db:migrate`
alone (no shim) fails on 0002 by design (docs/DATABASE.md).

## 5. Event taxonomy (confirmed complete against the brief's list)

All 16 events the brief names already exist in `interaction_event_name_check`
(0001 + 0003): `page_view`, `landing_view`, `cta_click`, `social_click`,
`whatsapp_click`, `outbound_click`, `contact_created`, `product_view`,
`offer_view`, `lead_submitted`, `interest_selected`, `checkout_started`,
`purchase`, `subscription_started`, `subscription_cancelled`,
`event_registration`. Nothing added or changed in this block — Phase 4
of the brief asked to *confirm* this list, not extend it.

## 6. Environment variables (confirmed against `src/server/env.ts`/`src/lib/env.ts`)

| Variable | Required for | Source of truth |
|---|---|---|
| `DATABASE_URL` | Every DB-backed route | `src/server/env.ts` |
| `NEXT_PUBLIC_SITE_URL` | Metadata, sitemap, OG tags | `src/lib/env.ts` |
| `ANALYTICS_API_TOKEN` | `/api/analytics/*` bearer-token path | `src/server/env.ts` |
| `ADMIN_PASSWORD_HASH` | `/admin/login` | `src/server/env.ts` |
| `ADMIN_SESSION_SECRET` | Admin session cookie + `/api/analytics/*` session path | `src/server/env.ts` |

No variable was invented or renamed. **A real Supabase `DATABASE_URL`
needs `sslmode=require`** (or an equivalent `ssl` param) — Supabase's
own "Connection string" panel already includes this; `pg` reads
`sslmode` straight from the connection string, so no code change is
needed as long as the string Cristian provides is copied verbatim from
Supabase's dashboard, not hand-typed. This is a documentation note, not
a code change — there is nothing to fix without a real string to test
against.

## 7. `/api/lead`, `/go/[slug]`, `/redes`, `/api/analytics/*`, `/api/checkout/[offerSlug]` against Supabase

All five already go exclusively through `getPool()`
(`src/server/db/pool.ts`) → `DATABASE_URL` — none holds any
Postgres-specific assumption beyond standard SQL already exercised in
every integration test against a disposable Postgres. Nothing in any of
these five routes needs to change to run against Supabase instead of
local Postgres; the connection string is the only variable. This was
verified by code inspection (no route imports anything Supabase-JS-
specific) — not yet by an actual request against a live Supabase
project (§3).

## 8. Local validation run in this block (Phase 12, the part that doesn't need real Supabase)

`npm run db:setup:test` — shim → `db:migrate` (all 5 migration files,
in order, on a **freshly-created, empty** disposable Postgres 16
database) → `db:seed`, then the full suite:

```
npm run lint            → clean
npm run typecheck       → clean
npm test                → 98/98
npm run test:integration → 74/74
npm run build            → clean
```

This is the strongest verification available without a real Supabase
connection: the exact same 5 migration files, applied in the exact same
order, by the exact same script (`migrate.mjs`) a real project would
use, onto a database that started genuinely empty — i.e., a real dry
run of "what happens when these migrations hit a clean Supabase
project," minus Supabase's own `auth` schema (provided here by the
local-only shim instead) and minus anything already-diverged in a real
project (§3, unknown).

## 9. Seed data (Phase 8 — reviewed, not re-run against anything new)

`supabase/seed.sql` already covers, idempotently (`on conflict do
nothing`, safe to run repeatedly, no placeholders needed since none of
this is invented pricing/commercial copy — it's dictionary labels):

- **Fuentes**: instagram, facebook, tiktok, youtube, linkedin, google,
  whatsapp, website, referral, show, school, university, event, other —
  covers every source the brief lists (Instagram/Facebook/TikTok/
  YouTube/WhatsApp/QR¹/Evento/Show/Colegio/Universidad/Orgánico²/Pauta³).
  ¹QR isn't a `source` row — it's `qr_source`, a separate dimension by
  design (docs/ATTRIBUTION.md). ²"Orgánico" maps to `website`/`referral`/
  a null-medium visit, not a distinct source row — "organic" is a
  `medium` value, not a `source`, matching the existing
  `visitor.first_touch_medium`/`lead.medium` convention. ³"Pauta" (paid)
  is likewise a `medium`/`campaign` concept (a campaign's own
  `status`/date range), not a new source row — no paid-source row was
  invented since no real ad platform is connected yet (unchanged from
  Block 03/05's own scope limits).
- **Intereses**: training, community, music, products (+
  physical_products/digital_products), course, coaching (+
  elite_coaching), shows, events, brands, sponsors — a superset of the
  brief's list (entrenar/comunidad/música/productos/shows/marcas/
  coaching/eventos all present under their existing slugs).
- **Social**: whatsapp-community, instagram-main, tiktok-main,
  youtube-main, facebook-subscription — all placeholder URLs
  (`https://instagram.com/`, etc., not a real handle) since no real
  account URL was provided; **no LinkedIn row** — the brief said "si
  corresponde," and no LinkedIn presence has been confirmed, so none
  was invented (`social_profile.platform`'s CHECK constraint already
  allows `'linkedin'` — adding the row is a one-line `INSERT` once a
  real URL exists, see `docs/MANUAL_SETUP_CHECKLIST.md`).
- **Campañas / QR / Producto / Oferta**: unchanged from Block 02/05 —
  `aura-2026`, `show-medellin-2026`, `music-launch` campaigns; two
  registered QR codes; the 5 catalog products/2 offers from Block 02/05.

Nothing new was added to `seed.sql` in this block — it already matched
the brief's Phase 8 request from when Block 02 wrote it. Verified
idempotent by construction (`on conflict do nothing` throughout) and
exercised fresh in §8 above.

## 10. Deployment (Vercel) — noted, not yet executed

Not yet connected in this session (no Vercel MCP/credential either —
see `docs/MANUAL_SETUP_CHECKLIST.md`). One operational risk worth
flagging now, before it's connected: `src/server/db/pool.ts` keeps one
`pg.Pool` (`max: 5`) per server process. On Vercel's serverless model,
each concurrent function instance gets its own process — under real
traffic this can open many small pools simultaneously and approach
Supabase's connection limit faster than a single long-lived server
would. Supabase's own connection pooler (PgBouncer, "Transaction"
mode, typically port 6543) exists exactly for this; **using the
pooler's connection string for `DATABASE_URL` in the Vercel deployment
(not the direct 5432 one) is the standard mitigation** — a
configuration choice at deploy time, not a code change. Documented here
so it isn't rediscovered under load; not applied because there is no
Vercel project to apply it to yet.

## 11. Rollback

Every migration is additive (columns, tables, indexes, constraints —
never a `DROP`/destructive rewrite, verified across all 5 files). If a
migration ever needs to be undone against a real project: hand-write a
new migration file that reverses it (e.g. `drop column ...`) — **never**
edit or delete the original file, and never run a raw rollback outside
`supabase/migrations/` (breaks `schema_migrations`'s tracking). No
migration in this repo has ever needed this yet.

## 12. Riesgos conocidos

- **No real Supabase project audited** — the single largest open risk
  of this block; everything in §2 is "expected," not "confirmed live."
- **Connection pooling under Vercel serverless** (§10) — a real,
  known-pattern risk, not yet applicable since there's no deployment yet.
- **`sslmode=require`** (§6) — untested against a real endpoint; the
  code is ready, the connection string is the unknown.
- **RLS is defense-in-depth only** — unchanged risk carried from Block
  02, restated here: if `DATABASE_URL` in Vercel's env vars is ever the
  `service_role` string (bypasses RLS) and that value leaks, RLS does
  not protect the data. Standard Supabase/Vercel secret hygiene (env
  vars scoped to server, never `NEXT_PUBLIC_*`) is the actual control —
  already the case in `.env.example`'s naming.

## 13. Operaciones manuales

See `docs/MANUAL_SETUP_CHECKLIST.md` for the complete, categorized list.
The one blocking this entire block: **a real Supabase project's
connection string** (or, if available, a Supabase MCP connector
enabled for this session) — nothing past §1/§2/§4-§9/§11 above can
become "confirmed" instead of "expected"/"designed" without it.
