-- 0008_social_platform_paypal_nequi.sql — Block 08.10: a support/donate
-- link, Cristian's own request (2026-08-28).
--
-- Same pattern as 0006 (which added 'twitter'): extending the
-- `social_profile.platform` check constraint additively instead of
-- routing a real, permanent channel through 'other'. Adds both
-- 'paypal' (real link already provided) and 'nequi' (Cristian said
-- he's about to check for one) in the same migration rather than a
-- second one later for the same feature.

alter table social_profile drop constraint social_profile_platform_check;
alter table social_profile add constraint social_profile_platform_check check (platform in (
  'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'whatsapp', 'spotify', 'twitter', 'paypal', 'nequi', 'other'
));
