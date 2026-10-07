-- 0020_free_app_progress.sql — the free public app + progress tracking
-- (2026-10-07, Cristian: anyone coming from TikTok can sign up for free,
-- follow a routine, time their workouts and log max tests; paying
-- students get the same tools). Additive only.

-- Max tests: push-ups join pull-ups/dips/plank/weight (0017).
alter table training_measurement
  add column push_ups smallint check (push_ups >= 0);

-- The workout timer: how long the student took to finish that day's
-- routine, in seconds (<= 6 h — anything longer is a forgotten timer).
alter table training_log
  add column duration_seconds integer check (duration_seconds between 1 and 21600);
