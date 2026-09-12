-- ---------------------------------------------------------------------
-- campaign: an optional collaborator credit (2026-09-12, Cristian's own
-- request for Támesis — José Miguel, who performs "el globo de la
-- muerte" alongside him and is helping show the QR during that segment
-- of the show). Same additive, per-campaign-optional pattern as
-- 0009-0012 (instagram_reel_url, event_description, press_url/label,
-- hero/press images): every field nullable, every other
-- /bienvenida/[slug] page unaffected until its own campaign opts in.
--
-- Deliberately its own field set, not a reuse of press_url/press_image_url
-- (0011/0012) — those are specifically about press/media coverage; this
-- is crediting a real co-performer, a different kind of fact even
-- though the rendered shape (photo + label + external link) looks
-- similar on the page.

alter table campaign
  add column collaborator_name text,
  add column collaborator_role text,
  add column collaborator_url text,
  add column collaborator_image_url text;

comment on column campaign.collaborator_name is
  'Real name of a co-performer/collaborator credited on this campaign''s bienvenida page — never invented.';
comment on column campaign.collaborator_role is
  'Short, real description of what they do (e.g. "Globo de la muerte") — optional.';
comment on column campaign.collaborator_url is
  'Real external link to the collaborator''s own social profile (their account, not ours — never routed through GoLink/social_profile, which model Cristian''s own channels).';
comment on column campaign.collaborator_image_url is
  'Real photo of Cristian with the collaborator, when one exists.';
