-- 0002_rls_policies.sql
-- Row Level Security. Supabase-only — this references the `auth` schema
-- that Supabase provisions and does NOT apply to a plain local/CI
-- Postgres instance. Local and CI test runs apply 0001 only; this file
-- is exercised by `npm run db:migrate -- --supabase` against a real
-- Supabase project. See docs/SECURITY.md for the full model.
--
-- Today's actual security boundary: every write in this app goes through
-- server-only code (Next.js Route Handlers) using a service-role Postgres
-- connection, which Supabase exempts from RLS by design — the service
-- role key never reaches the client bundle (see src/server/db/pool.ts).
-- RLS below is enabled with NO permissive policies for `anon` /
-- `authenticated` on every business table, which means: if a service-role
-- credential ever leaked into a client context, or a future feature adds
-- direct client-side Supabase reads, the default is a hard lockout, not
-- an accidental open table. The one deliberate exception is
-- `social_profile`, which is genuinely public content (see below).
--
-- Not built yet, on purpose: per-contact self-service policies (e.g. "a
-- logged-in contact can read their own orders") require a
-- contact.auth_user_id column linking to auth.users, which doesn't exist
-- because there is no authentication in this block. Add both together
-- when the auth block lands — see docs/SECURITY.md, "Deferred".

alter table source enable row level security;
alter table campaign enable row level security;
alter table qr_source enable row level security;
alter table social_profile enable row level security;
alter table interest enable row level security;
alter table visitor enable row level security;
alter table contact enable row level security;
alter table contact_visitor enable row level security;
alter table contact_interest enable row level security;
alter table interaction enable row level security;
alter table lead enable row level security;
alter table product enable row level security;
alter table offer enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table subscription enable row level security;
alter table b2b_opportunity enable row level security;

-- Public, read-only: the whole point of social_profile is to be shown to
-- anonymous visitors on /redes and in the site footer.
create policy social_profile_public_read on social_profile
  for select
  to anon, authenticated
  using (active = true);

-- Public, read-only: an active offer is meant to be visible on its
-- landing page without requiring auth (e.g. a course price).
create policy offer_public_read on offer
  for select
  to anon, authenticated
  using (active = true);

create policy product_public_read on product
  for select
  to anon, authenticated
  using (active = true);
