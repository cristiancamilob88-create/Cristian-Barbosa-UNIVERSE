-- 0004_lead_medium.sql — Block 04.1: Command Center visual/data layer.
--
-- `lead` already captures source_id/campaign_id/qr_id at creation time
-- (the touch resolved by src/server/db/repositories/reference.ts's
-- resolveTouch(), same call that already resolves `medium` — see
-- ResolvedTouch — it just wasn't persisted onto `lead` in Block 02/03).
-- Adding it here is what makes "leads by medium" answerable without a
-- join through contact.first_touch_medium (a different attribution
-- basis — see docs/ANALYTICS_ENGINE.md's dimension table) and without a
-- new dictionary table: medium is intentionally free text everywhere
-- else in this schema (visitor/contact/interaction), not FK'd, so this
-- follows the same convention.
--
-- Purely additive: nullable column, no backfill needed (existing rows
-- simply have medium = null, same as any other pre-existing optional
-- attribution field). Reversible: `alter table lead drop column medium;`.

alter table lead add column medium text;

comment on column lead.medium is
  'utm_medium at lead-creation time (e.g. social, qr, email, cpc) — '
  'same resolved touch that already populates source_id/campaign_id/qr_id. '
  'Free text, not FK''d, matching visitor/contact/interaction.medium.';
