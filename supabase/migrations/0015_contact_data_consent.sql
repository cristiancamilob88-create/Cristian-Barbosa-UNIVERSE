-- ---------------------------------------------------------------------
-- contact.data_consent_at (2026-09-24): proof of the data-processing
-- authorization Colombian law requires before storing personal data
-- (Ley 1581 de 2012, Decreto 1377 de 2013 art. 7-8 — the controller
-- must be able to show when and how the person authorized it).
--
-- Set by /api/lead every time a person submits the form with the
-- (now mandatory) authorization checkbox ticked; the latest
-- authorization wins. Nullable on purpose: contacts captured before
-- this column existed have no recorded authorization, and that fact
-- stays visible instead of being back-filled with an invented date.
-- The policy version accepted is stored alongside, so a future policy
-- change can tell who accepted which text.

alter table contact
  add column data_consent_at timestamptz,
  add column data_consent_version text;

comment on column contact.data_consent_at is
  'When this contact last authorized personal-data processing (Ley 1581/2012) via the /api/lead form checkbox. Null = captured before consent was recorded.';
comment on column contact.data_consent_version is
  'Which privacy-policy version (src/config/legal.ts, privacyPolicyVersion) the contact accepted at data_consent_at.';
