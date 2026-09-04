-- 0012_campaign_hero_and_press_image.sql — two more optional per-campaign
-- media overrides for /bienvenida/[slug]: a hero photo, and a press-photo
-- to go with the existing press_url link.
--
-- Cristian's request (2026-09-04): swap Concordia's hero photo for a
-- more representative one, and show the actual El Colombiano clipping
-- photo next to that interview link instead of just bare text. Nullable
-- and additive, same pattern as instagram_reel_url/event_description/
-- press_url — every other campaign keeps its current defaults until it
-- opts in.

alter table campaign add column hero_image_url text;
alter table campaign add column press_image_url text;

comment on column campaign.hero_image_url is
  'Optional per-campaign override for the full-bleed hero photo on '
  '/bienvenida/[slug]. Null = the page''s own default (cristian-hero-02.jpg).';
comment on column campaign.press_image_url is
  'Optional photo of the actual press coverage (e.g. a newspaper '
  'clipping), shown alongside campaign.press_url. Null = link only, no image.';
