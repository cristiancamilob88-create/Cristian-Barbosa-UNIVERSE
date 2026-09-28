-- ---------------------------------------------------------------------
-- lead: where the requested event is (2026-09-28). Cristian added
-- Google Maps address autocomplete to the contact form, shown only when
-- the topic is "shows" — the one request where a place actually
-- matters (quoting a show depends on where it is). Stored per lead, not
-- per contact: it's the location of *this* request's event, not where
-- the person lives.
--
-- All nullable: every other topic, and every lead before this, has no
-- address. `event_address_line` is also the fallback plain-text field
-- when no Maps key is configured (no structured parts, no coordinates).

alter table lead
  add column event_address_line text,
  add column event_address_detail text,
  add column event_city text,
  add column event_region text,
  add column event_postal_code text,
  add column event_country text,
  add column event_latitude double precision,
  add column event_longitude double precision,
  add column event_place_id text;

comment on column lead.event_address_line is
  'Street address (or free text when Maps autocomplete is unavailable) of the event this lead asks about — shows requests only.';
