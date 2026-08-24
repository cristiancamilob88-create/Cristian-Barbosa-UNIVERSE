-- 0007_entitlement.sql — Block 08: the "access after confirmed purchase"
-- primitive, designed for music but not specific to it (docs/
-- MASTER_BRIEF_BLOCK_08.md, "08.2": "NO crear una solución específica
-- únicamente para una canción... debe soportar song 01, song 02,
-- song 03, etc." — same reasoning applies to any future gated digital
-- good: a course, a PDF, exclusive content).
--
-- Deliberately NOT a new payment/checkout system — it's the one new
-- fact this schema was missing: "does this contact have confirmed
-- access to this product." Everything upstream of it is either already
-- built (product/offer/orders/order_items, Block 02/05) or explicitly
-- out of scope until a real payment provider is chosen for digital
-- goods (Decision Gate 3, docs/MASTER_BRIEF_BLOCK_07_10.md) — no
-- webhook, no storage/delivery mechanism, no UI reads this table yet.
-- `grantEntitlement()` (src/server/db/repositories/entitlement.ts) is
-- the only writer, and nothing calls it yet — there is no real song to
-- grant access to (title/artwork not confirmed), so this ships as
-- tested, unpopulated infrastructure, same pattern as `checkout_started`
-- sat unused from Block 02 until Block 05 gave it a real caller.
--
-- One row per (contact, product): a contact either has access to a
-- given digital product or doesn't — `order_id` records which specific
-- purchase granted it, nullable for a future non-purchase grant path
-- (a manual comp, a promo) without needing a fabricated order row.

create table entitlement (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  product_id uuid not null references product(id) on delete restrict,
  order_id uuid references orders(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (contact_id, product_id)
);

create index entitlement_contact_idx on entitlement (contact_id);

comment on table entitlement is
  'Confirms a contact has access to a specific product (e.g. a purchased song) — the one primitive Block 08''s music/digital-product access model needed. No storage/delivery mechanism here on purpose: this table only answers yes/no, never serves content.';

-- 0002_rls_policies.sql enabled RLS on the 17 tables that existed at
-- the time — it never retroactively applies to a table created later.
-- Same deny-by-default convention as every other business table
-- (docs/SECURITY.md): no public policy, since there is no legitimate
-- anon/authenticated read path for entitlements — only the server-only
-- connection (which bypasses RLS by design) ever reads this table.
alter table entitlement enable row level security;
