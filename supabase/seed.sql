-- seed.sql — safe development seed data. No real customer data.
--
-- Idempotent: safe to run more than once against the same database
-- (every insert is keyed on the table's natural unique slug).

insert into source (slug, label, category) values
  ('instagram', 'Instagram', 'social'),
  ('facebook', 'Facebook', 'social'),
  ('tiktok', 'TikTok', 'social'),
  ('youtube', 'YouTube', 'social'),
  ('linkedin', 'LinkedIn', 'social'),
  ('google', 'Google', 'search'),
  ('whatsapp', 'WhatsApp', 'messaging'),
  ('website', 'Sitio web', 'direct'),
  ('referral', 'Referido', 'referral'),
  ('show', 'Show en vivo', 'event'),
  ('school', 'Colegio', 'event'),
  ('university', 'Universidad', 'event'),
  ('event', 'Evento', 'event'),
  ('other', 'Otro', 'other')
on conflict (slug) do nothing;

insert into interest (slug, label) values
  ('training', 'Entrenamiento'),
  ('community', 'Comunidad'),
  ('music', 'Música'),
  ('products', 'Productos'),
  ('physical_products', 'Productos físicos'),
  ('digital_products', 'Productos digitales'),
  ('course', 'Curso digital'),
  ('coaching', 'Coaching'),
  ('elite_coaching', 'Coaching Elite'),
  ('shows', 'Shows'),
  ('events', 'Eventos'),
  ('brands', 'Marcas'),
  ('sponsors', 'Sponsors')
on conflict (slug) do nothing;

insert into social_profile (slug, platform, label, url, display_order, category) values
  ('whatsapp-community', 'whatsapp', 'Comunidad WhatsApp', 'https://wa.me/', 1, 'community'),
  ('instagram-main', 'instagram', 'Instagram', 'https://instagram.com/', 2, 'social'),
  ('tiktok-main', 'tiktok', 'TikTok', 'https://tiktok.com/@', 3, 'social'),
  ('youtube-main', 'youtube', 'YouTube', 'https://youtube.com/@', 4, 'social'),
  ('facebook-subscription', 'facebook', 'Entrena con Cristian Barbosa', 'https://facebook.com/', 5, 'community')
on conflict (slug) do nothing;

insert into campaign (slug, name, status) values
  ('aura-2026', 'Aura 2026', 'active'),
  ('show-medellin-2026', 'Show Medellín 2026', 'active'),
  ('music-launch', 'Lanzamiento musical', 'active')
on conflict (slug) do nothing;

insert into qr_source (slug, campaign_id, source_id, destination_path)
select 'aura-2026-main', c.id, s.id, '/entrenar'
from campaign c, source s
where c.slug = 'aura-2026' and s.slug = 'event'
on conflict (slug) do nothing;

insert into qr_source (slug, campaign_id, source_id, destination_path)
select 'show-medellin-2026-main', c.id, s.id, '/shows'
from campaign c, source s
where c.slug = 'show-medellin-2026' and s.slug = 'show'
on conflict (slug) do nothing;

insert into product (slug, name, kind, external_provider) values
  ('facebook-subscription', 'Entrena con Cristian Barbosa', 'subscription', 'facebook'),
  ('digital-course', 'Curso digital', 'digital', null),
  ('coaching-essential', 'Coaching Essential', 'coaching', null),
  ('coaching-performance', 'Coaching Performance', 'coaching', null),
  ('coaching-elite', 'Coaching Elite', 'coaching', null)
on conflict (slug) do nothing;

insert into offer (product_id, slug, name, currency, landing_path)
select id, 'facebook-subscription-standard', 'Entrena con Cristian Barbosa', 'COP', '/comunidad'
from product where slug = 'facebook-subscription'
on conflict (slug) do nothing;

insert into offer (product_id, slug, name, currency, landing_path)
select id, 'digital-course-standard', 'Curso digital', 'COP', '/productos'
from product where slug = 'digital-course'
on conflict (slug) do nothing;
