-- 0006_social_platform_twitter.sql — Block 07: real social channels.
--
-- Cristian's confirmed channel list (docs/MASTER_BRIEF_BLOCK_07_10.md,
-- "Block 07" addendum) includes X (https://x.com/crisbarbosa2020), the
-- one platform `social_profile.platform`'s check constraint didn't
-- cover yet (instagram/facebook/tiktok/youtube/linkedin/whatsapp/
-- spotify/other — 0001). Extending the constraint additively, same
-- pattern as 0005's `product_kind_check` extension: never widen a
-- taxonomy by routing a real channel through 'other' when a real,
-- permanent category exists for it.

alter table social_profile drop constraint social_profile_platform_check;
alter table social_profile add constraint social_profile_platform_check check (platform in (
  'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'whatsapp', 'spotify', 'twitter', 'other'
));
