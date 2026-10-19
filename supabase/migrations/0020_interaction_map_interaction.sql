-- 0020_interaction_map_interaction.sql — the tour map's own event
-- (Cristian, 2026-10-19: "¿es posible captar en el panel qué pueblo
-- buscaron o qué pin tocaron?").
--
-- `map_interaction` records a town search, a pin tap, a tap on the
-- map's town list, or a town typed into the homepage's "¿Ya estuvo en
-- tu pueblo?" box; metadata is {action, town, query?, found?}. See
-- docs/ANALYTICS_ENGINE.md, "Event taxonomy audit", for why this is a
-- new name and not a cta_click. Same additive pattern as 0003: drop and
-- re-add the check constraint with the full list.

alter table interaction drop constraint interaction_event_name_check;
alter table interaction add constraint interaction_event_name_check check (event_name in (
  'page_view', 'landing_view', 'cta_click', 'social_click', 'whatsapp_click', 'outbound_click',
  'lead_submitted', 'contact_created', 'interest_selected', 'product_view', 'offer_view',
  'checkout_started', 'purchase', 'subscription_started', 'subscription_cancelled', 'event_registration',
  'map_interaction'
));
