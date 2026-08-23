# SUPABASE_PRODUCTION.md — Block 06: real Supabase, safely

**Status as of this block: the 5 migrations + seed are applied to the
real Supabase project and fully verified, read-only, post-apply.**
Project `Cristian-Barbosa-UNIVERSE` (ref `yskfntcurmqqxjuvqoto`,
region `us-west-2`) went from a completely empty database (0 tables) to
the full schema described in §2 below, applied one migration at a time
via the official Supabase MCP connector, with an explicit read-only
validation after each step (§3). No `DATABASE_URL`/`SUPABASE_*` secret
was ever pasted into this session or committed to this repo —
`.env.local`/`.env*` remain correctly absent (git-ignored, per
docs/SECURITY.md); the deployment tool was the MCP connector's
`apply_migration`/`execute_sql`, authenticated via OAuth outside this
chat. See `docs/MANUAL_SETUP_CHECKLIST.md` for the itemized manual/
automatable split across every external service this project eventually
touches, not just Supabase.

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
against a **clean** database. Every row below has now been verified
**live** against the real project (§3) — "Confirmado" means read back
from `yskfntcurmqqxjuvqoto` itself after the corresponding migration
was applied, not inferred from the file.

| Recurso | Migración | Propósito | Dependencias | Estado |
|---|---|---|---|---|
| `extension pgcrypto` | 0001 | `gen_random_uuid()` for every table's `id` | — | Confirmado |
| `extension citext` | 0001 | Case-insensitive `contact.email` | — | Confirmado |
| `function set_updated_at()` | 0001 | Shared `updated_at` trigger body | — | Confirmado |
| `source` | 0001 | Extensible acquisition-source dictionary (find-or-create) | — | Confirmado |
| `campaign` | 0001 | Named acquisition effort, independent of source | trigger `set_updated_at` | Confirmado |
| `qr_source` | 0001 | Registered QR codes, pre-registered only | `source`, `campaign` (nullable FKs) | Confirmado |
| `social_profile` | 0001 | Outbound link registry (`/redes`, `/go/*`) | trigger `set_updated_at` | Confirmado |
| `interest` | 0001 | Canonical vocabulary of universe pillars | — | Confirmado |
| `visitor` | 0001 | Anonymous identity + first/last-touch | `source`, `campaign`, `qr_source` (nullable FKs) | Confirmado |
| `contact` | 0001 | A known person, deduped by email/phone | trigger `set_updated_at`, trigger `contact_protect_first_touch` | Confirmado |
| `contact_visitor` | 0001 | Links a visitor to the contact it became | `visitor`, `contact` (cascade) | Confirmado |
| `contact_interest` | 0001 | Many-to-many contact↔interest | `contact`, `interest` (cascade) | Confirmado |
| `interaction` | 0001, extended 0003 | The canonical event journal | `visitor` (required), `contact`/`source`/`campaign`/`qr_source` (nullable) | Confirmado |
| `lead` | 0001, extended 0004 | A qualified ask | `contact` (cascade), `interest`/`source`/`campaign`/`qr_source` (nullable) | Confirmado |
| `product` | 0001, extended 0005 | Catalog asset | trigger `set_updated_at` | Confirmado |
| `offer` | 0001, extended 0005 | Commercial presentation of a product | `product` (cascade), `campaign` (nullable), trigger `set_updated_at` | Confirmado |
| `orders` | 0001 | Named plural (`order` is reserved) | `contact` (cascade) | Confirmado |
| `order_items` | 0001 | Line items | `orders` (cascade), `offer` (restrict) | Confirmado |
| `subscription` | 0001 | External subscription state | `contact` (cascade), `product` (restrict), trigger `set_updated_at` | Confirmado |
| `b2b_opportunity` | 0001 | Shows/brands/sponsors pipeline | `contact` (cascade), `source`/`campaign` (nullable), trigger `set_updated_at` | Confirmado |
| RLS enabled, all 17 business tables | 0002 | Deny-by-default | needs Supabase's `auth` schema/roles — see §4 | Confirmado (Supabase) |
| RLS policy `social_profile_public_read` | 0002 | Public read, `active = true` | — | Confirmado |
| RLS policy `offer_public_read` | 0002 | Public read, `active = true` | — | Confirmado |
| RLS policy `product_public_read` | 0002 | Public read, `active = true` | — | Confirmado |
| `interaction.medium/content/term/referrer` | 0003 | Per-event attribution snapshot | — | Confirmado |
| `interaction.entity_type/entity_id` | 0003 | Polymorphic reference (`product`/`offer` views) | — | Confirmado |
| `interaction_event_name_check` (16 values) | 0003 | Full taxonomy (see §5) | — | Confirmado |
| `interaction_entity_idx`, `interaction_medium_idx` | 0003 | Partial indexes for the above | — | Confirmado |
| `lead.medium` | 0004 | Leads-by-medium without a `contact` join | — | Confirmado |
| `product.description/image_url/base_price_cents` | 0005 | Catalog presentation fields | — | Confirmado |
| `product_kind_check` (9 values) | 0005 | Extended category taxonomy | — | Confirmado |
| `offer.checkout_provider/checkout_url/purchase_type/cta_label/metadata` | 0005 | Checkout abstraction (docs/COMMERCE.md) | — | Confirmado |
| `schema_migrations` | (created by `migrate.mjs`, not a `.sql` file) | Tracks applied migration filenames | — | **No creada — ver nota abajo** |

**Note on `schema_migrations`**: the 5 migrations were applied to the
real project through the Supabase MCP connector's `apply_migration`
tool (per Cristian's explicit approval), not by running
`scripts/db/migrate.mjs` locally against the real `DATABASE_URL` — no
real `DATABASE_URL` was ever configured in this session (§13). That
script is what creates and populates `public.schema_migrations`, so
**this repo-specific bookkeeping table does not exist yet on the real
project**, even though all 5 migration *files* are fully applied
(confirmed independently by Supabase's own `list_migrations`, §3, and
by the live schema audit in §3). This is a real, documented gap, not
silently papered over: if `npm run db:migrate` is ever run directly
against this project's real `DATABASE_URL` in the future, it will try
to re-apply `0001`–`0005` from scratch (no `schema_migrations` row says
otherwise) and fail on the first `create table` (already exists).
**Before that ever happens**, either (a) run `db:migrate` once against
the real project so it creates `schema_migrations` and self-detects
each file needs a manual mark, or — simpler and recommended — (b) run
a one-time bootstrap that creates `schema_migrations` and inserts the 5
filenames directly (mirroring exactly what `migrate.mjs` would have
written), so `db:migrate` from then on correctly sees "up to date." This
was **not done in this block** — it needs Cristian's confirmation
first, since it's a write beyond the 5 approved migrations + seed, and
is out of scope for the read-only audit that follows. Flagged in §12
as a risk to close before anyone runs `db:migrate` against this project.

**"Estado: Confirmado" means "read back live from the real project"**
for every row except the one above — verified in §3, migration by
migration, immediately after each `apply_migration` call.

## 3. Real Supabase project — deployment + post-migration audit result

**Deployed and audited, via the official Supabase MCP connector**
(Cristian connected it through claude.ai `Settings → Connectors`; the
connector then had to be separately enabled for this chat session
before its tools appeared — a real, worth-documenting extra step beyond
account-level authorization, see git history of this file for the two
earlier attempts that found no access before this one).

- **Organization**: `cristian barbosa` (id `twzugojfuphgcvqrnnml`) — the
  connector's authorization is **org-wide, not scoped to one project**:
  `list_projects` returns three projects in this organization
  (`FINCA AGUAS BRAVAS` — INACTIVE, unrelated; `dysfunction-tournament-2027`
  — ACTIVE_HEALTHY, unrelated; and the target project below). Every
  write/read below was scoped explicitly to `project_id
  yskfntcurmqqxjuvqoto` — the other two were never touched.
- **Project confirmed matching, before and after applying anything**:
  name `Cristian-Barbosa-UNIVERSE`, **ref `yskfntcurmqqxjuvqoto`**,
  region `us-west-2`, Postgres 17 (`17.6.1.155`), status
  `ACTIVE_HEALTHY`, created `2026-08-23T13:47:24Z`.
- **Migrations applied, in order, each validated immediately after**
  (Cristian's approved 12-step sequence):
  1. `0001_init_schema.sql` → `apply_migration` succeeded → validated via
     `list_tables`: all 17 business tables present, 0 rows, RLS not yet
     enabled (correct — that's 0002).
  2. `0002_rls_policies.sql` → succeeded → validated: RLS enabled on all
     17 tables; exactly 3 policies exist
     (`social_profile_public_read`, `offer_public_read`,
     `product_public_read`), all `SELECT`-only for
     `{anon,authenticated}` with `active = true` — no unexpected policy.
  3. `0003_analytics_engine.sql` → succeeded → validated: `interaction`
     gained `medium`/`content`/`term`/`referrer`/`entity_type`/
     `entity_id`; the 16-value `interaction_event_name_check` matches
     the migration exactly; `interaction_entity_idx` and
     `interaction_medium_idx` exist with the correct partial-index
     definitions.
  4. `0004_lead_medium.sql` → succeeded → validated: `lead.medium`
     exists, nullable `text`.
  5. `0005_commerce_infrastructure.sql` → succeeded → validated:
     `product` gained `description`/`image_url`/`base_price_cents` and
     the 9-value extended `product_kind_check`; `offer` gained
     `checkout_provider`/`checkout_url`/`purchase_type`/`cta_label`/
     `metadata` with the exact defaults/nullability the migration
     specifies.
  6. `supabase/seed.sql` → executed via `execute_sql` (DML, not DDL) →
     validated by row count: `source`=14, `interest`=13,
     `social_profile`=5, `campaign`=3, `qr_source`=2, `product`=5,
     `offer`=2 — exact match. Every customer-data table (`visitor`,
     `contact`, `contact_visitor`, `contact_interest`, `interaction`,
     `lead`, `orders`, `order_items`, `subscription`,
     `b2b_opportunity`) = **0 rows** — no real customer data introduced.
- **Post-migration full-schema audit** (read-only, after all 5 +
  seed): 17 tables, 40 indexes, 47 functions in `public` (most of them
  `citext`'s own operator-support functions, not application code — see
  the `extension_in_public` note below), 9 distinct triggers (including
  `contact_protect_first_touch`, confirmed present), 3 RLS policies, 0
  native enum types (this schema uses `text` + `check` throughout, by
  design).
- **Extensions**: `pgcrypto` (schema `extensions`, 1.3) and `citext`
  (schema **`public`**, 1.6) — both required by `0001` and both
  installed by it (`create extension if not exists`). Plus Supabase's
  own defaults: `pg_stat_statements`, `uuid-ossp`, `supabase_vault`,
  `plpgsql`. No extension beyond what `0001` itself creates.
- **Interruption mid-deployment (transparency note)**: between applying
  `0001` (validated ✅) and `0002`, the Supabase MCP connector
  disconnected from this session (org-level auth stayed valid; the
  session-level "enabled in this chat" toggle had lapsed). No operation
  was attempted during the gap — `0002`–`0005` and the seed were applied
  only after Cristian re-enabled the connector and the reconnected
  session re-confirmed the project identity and re-read `0001`'s state
  (unchanged) before resuming at step 3 of the approved sequence.
- **Security advisors** (`get_advisors`, type `security`) — all
  informational/pre-existing, none introduced by this deployment, none
  fixed in this block (fixing any of them means either editing an
  already-applied migration, forbidden by this block's own rules, or
  writing a new migration, which is a scope decision for Cristian, not
  this block):
  - `rls_enabled_no_policy` (INFO) on 14 of the 17 business tables —
    **by design**: `0002`'s own header comment states the intent is a
    hard lockout for `anon`/`authenticated` on every table except the 3
    public-read ones; every write goes through the server-only
    `service_role` connection, which bypasses RLS. Not a bug.
  - `function_search_path_mutable` (WARN) on `set_updated_at` and
    `contact_protect_first_touch` — both defined in `0001`, unchanged;
    a real, standard Postgres/Supabase hardening lint (pin
    `search_path` on `SECURITY DEFINER`-adjacent functions), but fixing
    it means editing `0001` (forbidden) or a new migration (out of
    scope here).
  - `extension_in_public` (WARN) on `citext` — `0001` creates it without
    a target schema, so it lands in `public` by Postgres's default.
    Same reasoning as above: a real finding, not fixed in this block.
- **Performance advisors** (`get_advisors`, type `performance`): a set
  of `unindexed_foreign_keys` (INFO) and `unused_index` (INFO,
  mechanically expected — 0 real traffic yet) findings, all on the
  exact FK/index shape `0001`/`0003`/`0005` already chose deliberately
  (see those files' own comments and docs/ANALYTICS_ENGINE.md,
  "Indexes," for the stated reasoning against over-indexing a
  dictionary-sized or not-yet-trafficked table). Not acted on here for
  the same reason as above.

**Diferencia frente al repositorio**: **ninguna.** Las 5 migraciones y
el seed se aplicaron exactamente como están en `supabase/migrations/*`
y `supabase/seed.sql` — sin reescrituras, sin una segunda
implementación del schema, sin cambios de arquitectura. La única
divergencia real es operativa, no de schema: `public.schema_migrations`
(la tabla de bookkeeping de este repo) no existe todavía en el proyecto
real, porque las migraciones se aplicaron vía el conector MCP y no vía
`scripts/db/migrate.mjs` — ver la nota al final de §2 y el riesgo
correspondiente en §12.

Solo se ejecutaron los 5 `apply_migration` aprobados, un `execute_sql`
para el seed (DML, no DDL), y consultas de solo lectura
(`list_tables`, `list_migrations`, `list_extensions`, `get_advisors`,
`SELECT`s de auditoría) para cada validación. Ningún `DELETE`/`UPDATE`/
`DROP`/`ALTER` adicional/`TRUNCATE`/`CREATE` fuera de las 5 migraciones,
ningún cambio manual de policy o de RLS.

## 4. RLS model (design, confirmed live in §3)

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

## 8. Local validation run in this block

Run **after** the real deployment in §3, against the local disposable
Postgres 16 database (`cbu_test`) only — never against the real
Supabase project. `npm run db:setup:test` (shim → `db:migrate` →
`db:seed`; the 5 migrations were already applied there from earlier
blocks, `migrate.mjs` correctly reports them as already-up-to-date),
then the full suite:

```
npm run lint             → clean
npm run typecheck        → clean
npm test                 → 98/98 passed
npm run test:integration → 74/74 passed
npm run build            → clean (1 pre-existing, unrelated warning:
                            Turbopack couldn't find local override
                            metrics for the "Big Shoulders" font)
```

No `DATABASE_URL` for the real Supabase project was configured,
written to a file, or committed anywhere — the integration suite ran
against `postgresql://cbu:***@localhost:5432/cbu_test` (a local-only
role/database with no relation to the real project), exported as a
shell variable for the duration of the two commands that needed it and
nowhere else.

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

- **`public.schema_migrations` doesn't exist on the real project yet**
  (§2's last row) — the concrete, actionable risk from this block: a
  future direct `npm run db:migrate` against this project's real
  `DATABASE_URL` will try to re-run `0001`–`0005` from scratch and fail
  on the first `create table`. Needs a deliberate bootstrap (create the
  table + insert the 5 filenames) before that ever happens — not done
  here, since it's a write beyond what was approved for this block.
- **Three pre-existing security-lint findings**, none introduced here,
  none fixed here (§3): `function_search_path_mutable` on
  `set_updated_at`/`contact_protect_first_touch` (both from `0001`),
  and `extension_in_public` on `citext` (also `0001`). Fixing either
  means a new migration — a decision for Cristian, not an autonomous
  fix under this block's "no modifiques migraciones, no cambios extra"
  rule.
- **Connection pooling under Vercel serverless** (§10) — a real,
  known-pattern risk, not yet applicable since there's no deployment yet.
- **`sslmode=require`** (§6) — the real project's connection string was
  never pasted into this session (deployment went through the MCP
  connector, not a raw connection string), so this specific detail
  remains untested end-to-end from this app's own `pg` pool; the code
  is ready, only whichever connection string eventually goes into
  Vercel's `DATABASE_URL` needs to be copied verbatim from Supabase's
  dashboard (§6).
- **RLS is defense-in-depth only** — unchanged risk carried from Block
  02, restated here: if `DATABASE_URL` in Vercel's env vars is ever the
  `service_role` string (bypasses RLS) and that value leaks, RLS does
  not protect the data. Standard Supabase/Vercel secret hygiene (env
  vars scoped to server, never `NEXT_PUBLIC_*`) is the actual control —
  already the case in `.env.example`'s naming.

## 13. Operaciones manuales

See `docs/MANUAL_SETUP_CHECKLIST.md` for the complete, categorized list.
Supabase itself is no longer the blocker for this block — the 5
migrations + seed are live (§3). What's still open, for a future block:
the `schema_migrations` bootstrap (§12), Vercel's `DATABASE_URL` (the
pooler connection string, §10), and a real connection-string round-trip
from this app's own `pg` pool against the live project (§6), none of
which were approved as part of this block's scope.
