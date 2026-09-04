-- 0009_campaign_landing_media.sql — Block 08.10: per-campaign video and
-- a secondary WhatsApp group on /bienvenida/[slug].
--
-- Cristian's request (2026-08-28): the Concordia landing needs its own
-- video (the Westcol reel, not the generic presentation reel every
-- other /bienvenida/[slug] page shows) and a second WhatsApp link
-- distinct from the general community group — a niche group for that
-- specific school. Both nullable and additive: every existing campaign
-- (colegio-la-leticia-2026, etc.) keeps its current behavior (the
-- hardcoded generic reel, no second WhatsApp card) until it opts in.
--
-- `secondary_whatsapp_slug` is a soft reference to `social_profile.slug`
-- (not a foreign key — same non-FK slug-reference pattern
-- `qr_source.destination_path` already uses) so the second link still
-- goes through `/go/[slug]` like every other outbound channel
-- (docs/SOCIAL_ROUTING.md) instead of a raw untracked URL on the page.

alter table campaign add column instagram_reel_url text;
alter table campaign add column secondary_whatsapp_slug text;
alter table campaign add column secondary_whatsapp_label text;

comment on column campaign.instagram_reel_url is
  'Optional per-campaign Instagram reel/post URL for /bienvenida/[slug]. '
  'Falls back to the page''s own default reel when null.';
comment on column campaign.secondary_whatsapp_slug is
  'Optional social_profile.slug for a second, campaign-specific WhatsApp '
  'group card on /bienvenida/[slug] (e.g. a school-only group), shown '
  'alongside the always-present general community group. Null = not shown.';
comment on column campaign.secondary_whatsapp_label is
  'Display label for the secondary WhatsApp card above (e.g. "Grupo del colegio"). Required if secondary_whatsapp_slug is set.';
