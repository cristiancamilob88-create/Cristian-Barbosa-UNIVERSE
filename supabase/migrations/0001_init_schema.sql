-- 0001_init_schema.sql
-- Cristian Barbosa Universe — CRM + attribution + audience journey schema.
--
-- Portable Postgres (works against local dev, CI, and a real Supabase
-- project — nothing here is Supabase-specific). RLS policies live in
-- 0002_rls_policies.sql because they depend on Supabase's `auth` schema
-- and are not applicable to a plain local Postgres instance.
--
-- Design decisions recorded here, in full, in docs/DATABASE.md and
-- docs/DATA_MODEL.md. Summary of the ones worth knowing before reading
-- table-by-table:
--
-- 1. INTERACTION vs JOURNEY_EVENT: unified into one canonical table,
--    `interaction`. Both describe "something happened, tied to a visitor
--    and optionally a contact, at a point in time" — a second table would
--    duplicate the same shape for no new information.
-- 2. VISITOR is anonymous-identity-first: every browser gets a
--    `cb_visitor` cookie (src/proxy.ts) before any contact exists. A
--    `visitor` row anchors first/last-touch attribution and every
--    `interaction`, independent of whether that visitor is ever
--    identified. `contact_visitor` links a visitor to a contact once
--    known, without mutating prior interaction rows' meaning.
-- 3. SOURCE and CAMPAIGN are independent dimensions (never FK'd to each
--    other) — a campaign can run across multiple sources, a source can
--    serve multiple campaigns.
-- 4. Lookup tables (source, interest) are extensible at the application
--    layer: the app find-or-creates a `source` row for any utm_source it
--    hasn't seen, instead of rejecting unknown values.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------
-- updated_at trigger helper, reused by every table that has the column.
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =======================================================================
-- Lookup / dictionary tables
-- =======================================================================

create table source (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  -- Broad bucket used for read-model rollups (Dashboard "Acquisition").
  category text not null default 'other'
    check (category in ('social', 'search', 'referral', 'direct', 'event', 'messaging', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table source is
  'Extensible acquisition-source dictionary. The app find-or-creates a row '
  'for any utm_source it has not seen yet (category defaults to other) — '
  'this table is never meant to be exhaustively pre-populated.';

create table campaign (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table campaign is
  'A named acquisition effort (e.g. aura-2026, show-medellin-2026). '
  'Deliberately not FK''d to source: one campaign can run across several '
  'sources at once (a show promoted on Instagram AND via QR AND via WhatsApp).';

create trigger campaign_set_updated_at
  before update on campaign
  for each row execute function set_updated_at();

create table qr_source (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  campaign_id uuid references campaign(id) on delete set null,
  source_id uuid references source(id) on delete set null,
  -- Where the physical/printed QR points once scanned, e.g. "/entrenar".
  destination_path text not null default '/',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table qr_source is
  'Registry of QR codes as acquisition instruments. A QR''s printed URL '
  'already encodes utm_source/utm_medium=qr/utm_campaign matching this '
  'row (see docs/ATTRIBUTION.md) plus ?qr=<slug> for this table''s own '
  'identity — the proxy never queries this table at request time.';

create table social_profile (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  platform text not null
    check (platform in ('instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'whatsapp', 'spotify', 'other')),
  label text not null,
  url text not null,
  active boolean not null default true,
  display_order integer not null default 0,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table social_profile is
  'Single source of truth for outbound social/community links. Distinct '
  'from `source` (social_profile is "which account", source is "how a '
  'visit was attributed") — see docs/SOCIAL_ROUTING.md.';

create trigger social_profile_set_updated_at
  before update on social_profile
  for each row execute function set_updated_at();

create table interest (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);
comment on table interest is
  'Canonical, small vocabulary of universe pillars a contact can be '
  'interested in (training, music, shows, ...). Behavioral/commercial '
  'categories, not rigid identities — a contact can hold several.';

-- =======================================================================
-- Anonymous identity + attribution
-- =======================================================================

create table visitor (
  id uuid primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),

  first_touch_source_id uuid references source(id) on delete set null,
  first_touch_campaign_id uuid references campaign(id) on delete set null,
  first_touch_qr_id uuid references qr_source(id) on delete set null,
  first_touch_medium text,
  first_touch_content text,
  first_touch_term text,
  first_touch_referrer text,
  first_touch_landing_path text,
  first_touch_captured_at timestamptz,

  last_touch_source_id uuid references source(id) on delete set null,
  last_touch_campaign_id uuid references campaign(id) on delete set null,
  last_touch_qr_id uuid references qr_source(id) on delete set null,
  last_touch_medium text,
  last_touch_content text,
  last_touch_term text,
  last_touch_referrer text,
  last_touch_landing_path text,
  last_touch_captured_at timestamptz
);
comment on table visitor is
  'Anonymous identity anchor, keyed by the cb_visitor cookie value '
  '(assigned in src/proxy.ts before any contact exists). Rows are '
  'created lazily, on the first tracked interaction — not on every '
  'anonymous pageview. See docs/AUDIENCE_JOURNEY.md.';

-- =======================================================================
-- Contact (identified person) + journey linking
-- =======================================================================

create table contact (
  id uuid primary key default gen_random_uuid(),
  name text,
  first_name text,
  last_name text,
  email citext,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive')),

  first_touch_source_id uuid references source(id) on delete set null,
  first_touch_campaign_id uuid references campaign(id) on delete set null,
  first_touch_qr_id uuid references qr_source(id) on delete set null,
  first_touch_medium text,
  first_touch_content text,
  first_touch_term text,
  first_touch_referrer text,
  first_touch_landing_path text,
  first_touch_captured_at timestamptz,

  last_touch_source_id uuid references source(id) on delete set null,
  last_touch_campaign_id uuid references campaign(id) on delete set null,
  last_touch_qr_id uuid references qr_source(id) on delete set null,
  last_touch_medium text,
  last_touch_content text,
  last_touch_term text,
  last_touch_referrer text,
  last_touch_landing_path text,
  last_touch_captured_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table contact is
  'A known person. first_touch_* is copied once from the originating '
  'visitor at creation and is then immutable (see contact_protect_first_touch '
  'trigger below); last_touch_* is refreshed on every later identified '
  'touch. Deduplicated on lower(email) and phone — see the partial '
  'unique indexes below.';

create unique index contact_email_unique_idx on contact (email) where email is not null;
create unique index contact_phone_unique_idx on contact (phone) where phone is not null;

create trigger contact_set_updated_at
  before update on contact
  for each row execute function set_updated_at();

-- Hard guardrail, not just application discipline: once a contact's
-- first-touch has been captured, no UPDATE may change it. An app bug
-- that tries to "correct" first-touch attribution fails loudly instead
-- of silently corrupting the acquisition record.
create or replace function contact_protect_first_touch()
returns trigger
language plpgsql
as $$
begin
  if old.first_touch_captured_at is not null
     and new.first_touch_captured_at is distinct from old.first_touch_captured_at then
    raise exception 'contact.first_touch_captured_at is immutable once set (contact id: %)', old.id;
  end if;
  return new;
end;
$$;

create trigger contact_protect_first_touch_trg
  before update on contact
  for each row execute function contact_protect_first_touch();

create table contact_visitor (
  visitor_id uuid primary key references visitor(id) on delete cascade,
  contact_id uuid not null references contact(id) on delete cascade,
  linked_at timestamptz not null default now()
);
comment on table contact_visitor is
  'Links an anonymous visitor to the contact it turned out to be. One '
  'visitor maps to at most one contact; one contact can have several '
  'visitor_ids (multiple devices). Non-destructive: prior interaction '
  'rows for this visitor are backfilled with contact_id, never rewritten.';

create index contact_visitor_contact_id_idx on contact_visitor (contact_id);

create table contact_interest (
  contact_id uuid not null references contact(id) on delete cascade,
  interest_id uuid not null references interest(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, interest_id)
);

-- =======================================================================
-- Interaction — the single canonical event/journal table
-- (INTERACTION and JOURNEY_EVENT unified; see header comment)
-- =======================================================================

create table interaction (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitor(id) on delete cascade,
  contact_id uuid references contact(id) on delete set null,

  event_name text not null check (event_name in (
    'page_view', 'landing_view', 'cta_click', 'social_click', 'whatsapp_click',
    'lead_submitted', 'interest_selected', 'checkout_started', 'purchase',
    'subscription_started', 'subscription_cancelled', 'event_registration'
  )),
  route text,

  -- Attribution snapshot *at the moment of this event* (the visitor's
  -- last-touch when it fired) — required to reconstruct a journey like
  -- "arrived via Aura QR, then clicked Facebook, then submitted a lead".
  source_id uuid references source(id) on delete set null,
  campaign_id uuid references campaign(id) on delete set null,
  qr_id uuid references qr_source(id) on delete set null,

  -- Event-specific detail that doesn't deserve its own column (cta id,
  -- social network, product id, ...) instead of a wide nullable table.
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);
comment on table interaction is
  'Append-only journal every read model (leads this week, active '
  'subscriptions, journey reconstruction) derives from. One canonical '
  'event model — see the "INTERACTION vs JOURNEY_EVENT" decision above.';

create index interaction_visitor_id_created_at_idx on interaction (visitor_id, created_at);
create index interaction_contact_id_created_at_idx on interaction (contact_id, created_at) where contact_id is not null;
create index interaction_event_name_idx on interaction (event_name);
create index interaction_campaign_id_idx on interaction (campaign_id) where campaign_id is not null;

-- =======================================================================
-- Lead
-- =======================================================================

create table lead (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  interest_id uuid references interest(id) on delete set null,
  -- The raw topic string the form submitted, kept verbatim even when it
  -- doesn't map to a canonical interest (e.g. "coaching-elite") — see
  -- docs/CRM.md.
  topic_raw text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),

  source_id uuid references source(id) on delete set null,
  campaign_id uuid references campaign(id) on delete set null,
  qr_id uuid references qr_source(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_contact_id_idx on lead (contact_id);

create trigger lead_set_updated_at
  before update on lead
  for each row execute function set_updated_at();

-- =======================================================================
-- Commerce (catalog only — no payment processing in this block)
-- =======================================================================

create table product (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('physical', 'digital', 'subscription', 'coaching', 'show')),
  external_provider text,
  external_ref text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger product_set_updated_at
  before update on product
  for each row execute function set_updated_at();

create table offer (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  campaign_id uuid references campaign(id) on delete set null,
  slug text not null unique,
  name text not null,
  -- Nullable on purpose: final commercial pricing is an explicit
  -- non-goal of this block (see docs/CRM.md).
  price_cents integer,
  currency text not null default 'COP',
  landing_path text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table offer is
  'A commercial presentation of a product: the same product can have '
  'several offers (different price, campaign, landing page, or bonus) '
  'without duplicating the underlying product row.';

create trigger offer_set_updated_at
  before update on offer
  for each row execute function set_updated_at();

create index offer_product_id_idx on offer (product_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  external_provider text,
  external_order_id text,
  currency text not null default 'COP',
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
comment on table orders is
  'Named plural to avoid the reserved SQL keyword `order`. No payment '
  'processing is implemented in this block — this is catalog/read '
  'shape only, ready for a future checkout integration to write into.';

create index orders_contact_id_idx on orders (contact_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  offer_id uuid not null references offer(id) on delete restrict,
  quantity integer not null default 1,
  unit_price_cents integer not null,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on order_items (order_id);

create table subscription (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  product_id uuid not null references product(id) on delete restrict,
  provider text not null,
  external_subscription_id text,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  started_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table subscription is
  'Stores external subscription state (e.g. Facebook Subscription) — '
  'this app never recreates the provider''s own subscription engine.';

create index subscription_contact_id_idx on subscription (contact_id);

create trigger subscription_set_updated_at
  before update on subscription
  for each row execute function set_updated_at();

-- =======================================================================
-- B2B pipeline (shows, brands, sponsors)
-- =======================================================================

create table b2b_opportunity (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  source_id uuid references source(id) on delete set null,
  campaign_id uuid references campaign(id) on delete set null,
  category text not null check (category in ('shows', 'brands', 'sponsors')),
  estimated_value_cents integer,
  stage text not null default 'lead' check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index b2b_opportunity_contact_id_idx on b2b_opportunity (contact_id);
create index b2b_opportunity_stage_idx on b2b_opportunity (stage);

create trigger b2b_opportunity_set_updated_at
  before update on b2b_opportunity
  for each row execute function set_updated_at();
