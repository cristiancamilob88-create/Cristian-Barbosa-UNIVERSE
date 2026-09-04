-- 0011_campaign_press_url.sql — an optional per-campaign press/media
-- link for /bienvenida/[slug] ("En los medios").
--
-- Cristian's request (2026-09-04): show real press coverage (his
-- El Colombiano interview) on the Concordia page as a trust signal —
-- a real, verifiable link beats asking a visitor to go search Google
-- themselves. Nullable and additive, same pattern as
-- event_description/instagram_reel_url — every other campaign is
-- unaffected until it sets one.

alter table campaign add column press_url text;
alter table campaign add column press_label text;

comment on column campaign.press_url is
  'Optional external URL to real press coverage, shown as a link on '
  '/bienvenida/[slug] ("En los medios"). Null = no press block shown.';
comment on column campaign.press_label is
  'Display text for the press link above (e.g. "Entrevista con El '
  'Colombiano"). Falls back to a generic label when null.';
