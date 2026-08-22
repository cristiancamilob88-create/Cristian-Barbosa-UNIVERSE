# DATABASE.md — schema reference & migration instructions

Postgres (local for dev/test, Supabase in production — see
docs/ARCHITECTURE.md §4). Nothing in `supabase/migrations/0001_init_schema.sql`
is Supabase-specific; `0002_rls_policies.sql` is (it needs the `auth`
schema Supabase provisions — see docs/SECURITY.md).

## Setup

```bash
# 1. Point DATABASE_URL at a Postgres instance (.env.local, or exported
#    in your shell). A local Postgres works identically to Supabase here.
cp .env.example .env.local   # then edit DATABASE_URL

# 2. Apply migrations
npm run db:migrate

# 3. Load safe development seed data (sources, interests, social
#    profiles, sample products/offers/campaigns — no real customer data)
npm run db:seed
```

Migrations are tracked in a `schema_migrations` table (filename + applied
timestamp) — `db:migrate` is idempotent, safe to run on every deploy.
`db:seed` is also idempotent (`ON CONFLICT DO NOTHING` throughout
`supabase/seed.sql`).

### Running against a real Supabase project

`npm run db:migrate` works unchanged against a Supabase connection string
(it's model Postgres). `0002_rls_policies.sql` will only apply there,
since it needs Supabase's `auth` schema — running the same command
locally applies 0001 successfully and then fails on 0002 with a missing
`auth.uid()` function, which is expected (see "Local/CI testing" below).

### Local/CI testing

`npm run db:setup:test` runs, in order: `scripts/db/test-auth-shim.sql`
(recreates just enough of Supabase's `anon`/`authenticated`/`service_role`
roles and `auth.uid()` for RLS policies to apply and be testable outside
Supabase — **local/CI only, never run this against Supabase**), then
`db:migrate`, then `db:seed`. This is what CI does before running
`npm run test:integration` (see `.github/workflows/ci.yml`).

## Entity-relationship overview

```
source ─┐                    ┌─ interest
        │                    │
campaign─┼──▶ visitor ──▶ contact ──▶ contact_interest
        │        │            │
qr_source┘   contact_visitor  ├──▶ lead
                              ├──▶ orders ──▶ order_items ──▶ offer ──▶ product
                              ├──▶ subscription ──▶ product
                              └──▶ b2b_opportunity

interaction: visitor_id (required) + contact_id (nullable) + event_name
             + source_id/campaign_id/qr_id (attribution snapshot) + metadata
```

Full column-by-column rationale lives in the migration file itself
(`supabase/migrations/0001_init_schema.sql` is heavily commented — read it
alongside this doc) and in docs/DATA_MODEL.md for *why* each table exists.

## Tables

| Table | Purpose |
|---|---|
| `source` | Extensible acquisition-source dictionary (find-or-create). |
| `campaign` | Named acquisition effort, independent of source. |
| `qr_source` | Registered QR codes — pre-registered, never auto-created. |
| `social_profile` | Canonical outbound link registry (`/redes`, `/go/*`). |
| `interest` | Small, canonical vocabulary of universe pillars. |
| `visitor` | Anonymous identity anchor + first/last-touch attribution. |
| `contact` | A known person, deduplicated by email/phone. |
| `contact_visitor` | Links a visitor id to the contact it turned out to be. |
| `contact_interest` | Many-to-many: a contact's interests. |
| `interaction` | The single canonical event/journal table (see below). |
| `lead` | A qualified ask, tied to a contact + optional interest. |
| `product` / `offer` | Catalog (asset) vs. commercial presentation (price/campaign/landing). |
| `orders` / `order_items` | Named plural — `order` is a reserved SQL keyword. No payment processing yet. |
| `subscription` | External subscription state (e.g. Facebook Subscription) — never reimplements the provider. |
| `b2b_opportunity` | Lightweight pipeline for shows/brands/sponsors. |

### Why `interaction` instead of separate INTERACTION + JOURNEY_EVENT tables

Both were the same shape: something happened, tied to a visitor and
optionally a contact, with a type, a point in time, and some
event-specific detail. A second table would have meant every journey
query joins two near-identical tables instead of one. `interaction`'s
`event_name` CHECK constraint is the taxonomy (docs/ANALYTICS.md);
`metadata jsonb` holds the rest instead of a wide table of mostly-null
columns.

## Data-integrity guardrails worth knowing about

- **`contact_protect_first_touch` trigger**: rejects any UPDATE that
  changes `contact.first_touch_captured_at` once it's set. This is not
  just application discipline — verified in
  `contact.integration.test.ts`, a raw UPDATE from any code path gets a
  Postgres exception, not a silently corrupted acquisition record.
- **Partial unique indexes** on `contact.email`/`contact.phone` (`where
  ... is not null`) — dedup without forcing every contact to have both.
- **`citext` for `contact.email`** — case-insensitive matching without
  manual `lower()` calls scattered through queries.

## Extending the schema

Add a new file to `supabase/migrations/`, named with the next sequence
number (`0003_...`). Never edit an already-applied migration — `db:migrate`
tracks applied filenames, so editing one that already ran in any
environment means that environment silently never gets the edit. Run
`npm run db:setup:test` locally to verify a new migration applies cleanly
before committing it.
