-- 0010_campaign_event_description.sql — a short, optional per-campaign
-- announcement line for /bienvenida/[slug] (e.g. "Hoy, Cristian Barbosa
-- presenta un espectáculo artístico del Circo Santiago de Chile...").
--
-- Cristian's request (2026-09-04): the Concordia night-event page needs
-- to announce the actual show (a circus act, confirmed 15+ municipios
-- of experience) before he sends the link out. Nullable and additive,
-- same pattern as instagram_reel_url/secondary_whatsapp_slug (0009) —
-- every existing campaign keeps its current behavior (no announcement
-- shown) until it opts in.

alter table campaign add column event_description text;

comment on column campaign.event_description is
  'Optional short announcement line for /bienvenida/[slug] (e.g. what '
  'today''s show/event actually is). Null = no announcement block shown.';
