-- 0018_training_results_objective.sql — Plan Diciembre phase 2
-- (2026-09-30, Cristian: every student's routine is their own, and the
-- app has to MEASURE training, not just tick boxes). Two additive
-- columns, nothing rewritten.

-- What the student actually did per exercise, free text in their own
-- words ("10, 8, 7", "35 s", "12 kg") — one entry per exercise, same
-- positions as `done`. Free text on purpose: a set×rep scheme, a hold
-- time and a weight don't share one numeric shape, and Cristian reads
-- these; structured progress numbers are what training_measurement is for.
alter table training_log
  add column results text[] not null default '{}';

-- The student's main objective — drives how Cristian programs them and
-- which measurements matter (docs/TRAINING.md). `goal` stays as the
-- student's own words ("mi primera dominada antes de diciembre").
alter table training_enrollment
  add column objective text
    check (objective in ('bajar_peso', 'fuerza', 'tonificar', 'skills', 'general'));
