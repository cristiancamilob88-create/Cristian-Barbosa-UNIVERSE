-- 0003_analytics_engine.sql
-- Block 03 — analytics engine schema changes. Extends `interaction`
-- (still the single canonical event table — see 0001's header comment
-- and docs/DATA_MODEL.md) rather than adding a second events table.
--
-- Two kinds of change:
--
-- 1. Persist medium/content/term/referrer per event, not just
--    source_id/campaign_id/qr_id. `resolveTouch()` (src/server/db/
--    repositories/reference.ts) already computes these values for every
--    event — 0001/0002 just discarded them after resolving the ids.
--    Without them, "which content variant (reel-01 vs reel-02) converts
--    better" is unanswerable from history, because a visitor's *current*
--    last-touch can have moved on by query time.
-- 2. A generic, nullable (source_id, campaign_id, qr_id — style) polymorphic
--    reference: entity_type + entity_id, for events about a specific
--    catalog row (product_view, offer_view). No FK constraint is
--    possible on a polymorphic pair (it can point at product OR offer);
--    referential integrity there is an application-layer concern,
--    documented in docs/ANALYTICS_ENGINE.md.

alter table interaction
  add column medium text,
  add column content text,
  add column term text,
  add column referrer text,
  add column entity_type text check (entity_type in ('product', 'offer')),
  add column entity_id uuid;

comment on column interaction.entity_type is
  'Polymorphic reference target for entity-specific events (product_view -> product, offer_view -> offer). No FK — see migration header.';

-- Extend the event taxonomy. Additions and the rationale for each are in
-- docs/ANALYTICS_ENGINE.md ("Event taxonomy audit"):
--   contact_created   — fires once, when findOrCreateContact() actually
--                        creates a row, distinct from lead_submitted
--                        (which fires on every submission, new contact
--                        or not) — needed to separate "net-new people
--                        acquired" from "total leads received".
--   outbound_click     — /go/[slug] clicks on a social_profile that is
--                        neither "social" (instagram/facebook/tiktok/
--                        youtube/linkedin) nor whatsapp (e.g. spotify,
--                        a partner link) — was previously miscounted as
--                        social_click.
--   product_view /
--   offer_view          — reserved for Block 04's real catalog pages;
--                        taxonomy + entity_type/entity_id exist now so
--                        that block writes to an already-reviewed shape.
-- LEAD_CREATED was considered and deliberately NOT added: it would be a
-- pure synonym for the existing lead_submitted (see docs/ANALYTICS_ENGINE.md).
alter table interaction drop constraint interaction_event_name_check;
alter table interaction add constraint interaction_event_name_check check (event_name in (
  'page_view', 'landing_view', 'cta_click', 'social_click', 'whatsapp_click', 'outbound_click',
  'lead_submitted', 'contact_created', 'interest_selected', 'product_view', 'offer_view',
  'checkout_started', 'purchase', 'subscription_started', 'subscription_cancelled', 'event_registration'
));

-- Supports "top viewed products/offers" read models.
create index interaction_entity_idx on interaction (entity_type, entity_id) where entity_id is not null;

-- Supports date-range-filtered rollups grouped by medium/content — the
-- existing (campaign_id)/(event_name) indexes don't cover these.
create index interaction_medium_idx on interaction (medium) where medium is not null;
