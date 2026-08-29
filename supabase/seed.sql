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

-- Block 07 (docs/MASTER_BRIEF_BLOCK_07_10.md): Cristian's real channel
-- list, confirmed directly — closes the placeholder URLs above (Block
-- 01/02 seeded slugs before any real destination existed) and adds the
-- channels that had no row at all yet. UPDATE, not a second INSERT,
-- for every slug that already existed — `on conflict do nothing` never
-- touches an existing row, so a placeholder left in place would have
-- silently stayed wrong forever.
update social_profile set url = 'https://chat.whatsapp.com/CyhVeiJQueaHkf1U0HJcTw' where slug = 'whatsapp-community';
update social_profile set url = 'https://www.instagram.com/cristian_barbosa201' where slug = 'instagram-main';
update social_profile set url = 'https://www.tiktok.com/@cristianbarbosa201' where slug = 'tiktok-main';
update social_profile set url = 'https://m.youtube.com/channel/UCewT6SMEg50bAg2GOFGm_JA' where slug = 'youtube-main';
update social_profile set url = 'https://www.facebook.com/cristianbarbosa201/subscribe/' where slug = 'facebook-subscription';

insert into social_profile (slug, platform, label, url, display_order, category) values
  ('tiktok-secondary', 'tiktok', 'TikTok (cuenta secundaria)', 'https://www.tiktok.com/@cristian.barbosa930', 6, 'social'),
  ('instagram-community', 'instagram', 'Instagram Comunidad', 'https://www.instagram.com/cristianbarbosacomunity?igsi=ZmRvZnkzbnVwemxt&utm_source=qr', 7, 'community'),
  ('facebook-main', 'facebook', 'Facebook', 'https://www.facebook.com/share/1DqFXpnvfi/', 8, 'social'),
  ('facebook-secondary', 'facebook', 'Facebook (cuenta secundaria)', 'https://www.facebook.com/share/18wzSksgr4/', 9, 'social'),
  ('x-main', 'twitter', 'X (Twitter)', 'https://x.com/crisbarbosa2020', 10, 'social'),
  -- Distinct from whatsapp-community: this is the single commercial
  -- number for shows/coaching/marcas/productos/consultas (docs/
  -- MASTER_BRIEF_BLOCK_07_10.md, "07.12"), not the free community chat.
  ('whatsapp-commercial', 'whatsapp', 'WhatsApp comercial', 'https://wa.me/message/JIT2DR5FHC5TD1', 11, 'commercial'),
  -- Added 2026-08-28, Cristian's own link — the query string
  -- (utm_source=share_via&utm_content=profile&utm_medium=member_ios)
  -- is LinkedIn's own share-sheet tracking from the iOS app, not part
  -- of the actual profile URL, so it's stripped here rather than
  -- stored verbatim.
  ('linkedin-main', 'linkedin', 'LinkedIn', 'https://www.linkedin.com/in/cristian-barbosa-8828891bb/', 12, 'social'),
  -- Added 2026-08-28, Cristian's own PayPal donate link. Needs
  -- 0008_social_platform_paypal_nequi.sql applied first (adds 'paypal'
  -- to the platform check constraint).
  ('paypal-donate', 'paypal', 'Apóyame por PayPal', 'https://www.paypal.com/donate/?hosted_button_id=SQTHQU8SA2KG6', 13, 'support')
on conflict (slug) do nothing;

insert into campaign (slug, name, status) values
  ('aura-2026', 'Aura 2026', 'active'),
  ('show-medellin-2026', 'Show Medellín 2026', 'active'),
  ('music-launch', 'Lanzamiento musical', 'active'),
  -- Real school visit, 2026-08-27 (docs/RUNNING_CHECKLIST.md) — feeds
  -- the /bienvenida/[slug] QR landing's personalized greeting.
  ('colegio-la-leticia-2026', 'Colegio de la Leticia — Envigado', 'active'),
  -- A real, deliberate test scan (Cristian asking a friend to scan a
  -- QR today, 2026-08-25, before the real Leticia visit) — a separate
  -- campaign so this test traffic never mixes into colegio-la-leticia-2026's
  -- real numbers. Name says "prueba" on purpose, so it reads as a test
  -- anywhere it shows up in /admin, not a second real event.
  ('prueba-interna-2026-08-25', 'Prueba interna — QR test', 'active')
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

-- The slug here IS the /bienvenida/[slug] URL segment — the page looks
-- this row up directly by that path param (src/server/db/repositories/qrSource.ts).
insert into qr_source (slug, campaign_id, source_id, destination_path)
select 'colegio-la-leticia-2026', c.id, s.id, '/bienvenida/colegio-la-leticia-2026'
from campaign c, source s
where c.slug = 'colegio-la-leticia-2026' and s.slug = 'school'
on conflict (slug) do nothing;

-- 'other' source, not 'school' — this scan isn't attributed to any
-- real venue, it's a friend scanning to confirm the whole circuit
-- works before the real Leticia QR gets used on real kids.
insert into qr_source (slug, campaign_id, source_id, destination_path)
select 'prueba-interna-2026-08-25', c.id, s.id, '/bienvenida/prueba-interna-2026-08-25'
from campaign c, source s
where c.slug = 'prueba-interna-2026-08-25' and s.slug = 'other'
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

-- Block 07 (docs/MASTER_BRIEF_BLOCK_07_10.md): real price + real
-- destination now confirmed — 29.900 COP/month, Facebook's own
-- subscribe URL. price_cents follows the same convention as every
-- other monetary column in this schema (integer minor units — see
-- src/lib/format.ts's formatCents, cents / 100), so 29.900 COP ->
-- 2_990_000. checkout_provider = 'manual' (not a new enum value,
-- accurate as-is: there is no automated payment confirmation from
-- Facebook, docs/MASTER_BRIEF_BLOCK_07_10.md "07.SEC"/"Block 07" —
-- "no asumir integración API de Meta"). purchase_type = 'recurring'
-- (a monthly subscription, not a one-time sale) — resolveCheckoutDestination()
-- already documented this exact case in its own comments before this
-- offer ever had a real provider.
update offer set
  price_cents = 2990000,
  checkout_provider = 'manual',
  checkout_url = 'https://www.facebook.com/cristianbarbosa201/subscribe/',
  purchase_type = 'recurring',
  cta_label = 'Suscribirme por Facebook'
where slug = 'facebook-subscription-standard';

-- Block 07: the three coaching product rows existed since Block 02
-- with no offer of their own — /entrenar's coaching card linked
-- straight to /contacto, bypassing the checkout abstraction entirely.
-- Real prices now exist (1.100.000 / 1.600.000 / 2.000.000 COP), but
-- Cristian's own brief is explicit: coaching still closes over WhatsApp
-- with a human, not an automated checkout ("NO inventar checkout
-- automatizado para coaching todavía") — purchase_type stays 'quote'
-- on purpose, price_cents now set for catalog/admin display, no
-- checkout_provider/checkout_url (still 'unavailable' by default: there
-- is no checkout page for these to redirect to, WhatsApp is a GoLink,
-- not a CheckoutLink — see src/app/entrenar/page.tsx).
insert into offer (product_id, slug, name, currency, landing_path, purchase_type, price_cents, cta_label)
select id, 'coaching-essential-quote', 'Coaching Essential', 'COP', '/contacto?topic=coaching', 'quote', 110000000, 'Quiero entrenar personalmente con Cristian'
from product where slug = 'coaching-essential'
on conflict (slug) do nothing;

insert into offer (product_id, slug, name, currency, landing_path, purchase_type, price_cents, cta_label)
select id, 'coaching-performance-quote', 'Coaching Performance', 'COP', '/contacto?topic=coaching', 'quote', 160000000, 'Quiero entrenar personalmente con Cristian'
from product where slug = 'coaching-performance'
on conflict (slug) do nothing;

insert into offer (product_id, slug, name, currency, landing_path, purchase_type, price_cents, cta_label)
select id, 'coaching-elite-quote', 'Coaching Elite', 'COP', '/contacto?topic=coaching', 'quote', 200000000, 'Quiero entrenar personalmente con Cristian'
from product where slug = 'coaching-elite'
on conflict (slug) do nothing;

update offer set price_cents = 110000000 where slug = 'coaching-essential-quote';
update offer set price_cents = 160000000 where slug = 'coaching-performance-quote';
update offer set price_cents = 200000000 where slug = 'coaching-elite-quote';
