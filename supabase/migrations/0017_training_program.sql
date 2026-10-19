-- 0017_training_program.sql — personalized training programs (the
-- "Plan Diciembre" student area, 2026-09-30, Cristian's own request:
-- students sign up on the site, he approves them, and each one gets
-- their own weekly routine to check off inside the Universe).
--
-- Builds on what already exists instead of beside it:
--   - the person is a `contact` (name/email/phone/consent live there,
--     never duplicated here);
--   - the program is a `product` (kind 'coaching') with its own `offer`;
--   - access is an `entitlement` row (0007) — the ONE "does this contact
--     have access to this product" answer, reused as-is. An enrollment
--     is the training data for that access, not a second access flag.
--
-- Everything is read and written by server-only code (src/server/),
-- never by a browser — same model as every other table here.

-- One contact's run through one program: starts 'pending' (signed up,
-- not yet approved), becomes 'active' when Cristian approves it (which
-- is also when the entitlement is granted and start_date is set).
create table training_enrollment (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  product_id uuid not null references product(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'paused', 'finished', 'cancelled')),
  goal text check (char_length(goal) <= 300),
  level text not null default 'principiante'
    check (level in ('principiante', 'intermedio', 'avanzado')),
  zone text check (char_length(zone) <= 80),
  -- Set on approval, not on sign-up: week 1 starts the day Cristian
  -- says it does, not the day someone filled a form.
  start_date date,
  -- Length of this program in weeks — 12 for Plan Diciembre; a column,
  -- not a constant, so a future program can be shorter or longer.
  weeks smallint not null default 12 check (weeks between 1 and 52),
  -- The routine every week uses unless it has its own row in
  -- training_week_routine. Same JSON shape as routine_template.days.
  base_routine jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contact_id, product_id)
);

create index training_enrollment_status_idx on training_enrollment (status, created_at desc);

comment on table training_enrollment is
  'A contact''s run through one training program (e.g. Plan Diciembre). Access itself is the entitlement row for the same contact+product — this table holds the training data, not a second access flag.';

-- Reusable starting routines ("Principiante", later "Intermedio"), so a
-- new student never starts from a blank page. days = [{ title, kind,
-- exercises: [{ name, dose, cue }] }].
create table routine_template (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  days jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A week that differs from the student's base routine.
create table training_week_routine (
  enrollment_id uuid not null references training_enrollment(id) on delete cascade,
  week smallint not null check (week between 1 and 52),
  days jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, week)
);

-- What the student checked off on one day of one week, plus their note.
-- The week's % is computed from these rows, never stored.
create table training_log (
  enrollment_id uuid not null references training_enrollment(id) on delete cascade,
  week smallint not null check (week between 1 and 52),
  day_index smallint not null check (day_index between 0 and 13),
  done boolean[] not null default '{}',
  note text check (char_length(note) <= 1000),
  updated_at timestamptz not null default now(),
  primary key (enrollment_id, week, day_index)
);

-- Evaluations (start, end, and any in between).
create table training_measurement (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references training_enrollment(id) on delete cascade,
  measured_on date not null,
  pull_ups smallint check (pull_ups >= 0),
  dips smallint check (dips >= 0),
  plank_seconds smallint check (plank_seconds >= 0),
  weight_kg numeric(5,1) check (weight_kg > 0),
  created_at timestamptz not null default now()
);

create index training_measurement_enrollment_idx on training_measurement (enrollment_id, measured_on);

-- Student sign-in: a 6-digit code emailed to the contact, valid for a
-- few minutes and a handful of attempts. Only an HMAC of the code is
-- stored (src/server/db/repositories/memberLoginCode.ts), never the code itself.
create table member_login_code (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contact(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index member_login_code_contact_idx on member_login_code (contact_id, created_at desc);

-- Same deny-by-default convention as every business table (0002, 0007):
-- no anon/authenticated policy, only the server-only connection reads
-- or writes these.
alter table training_enrollment enable row level security;
alter table routine_template enable row level security;
alter table training_week_routine enable row level security;
alter table training_log enable row level security;
alter table training_measurement enable row level security;
alter table member_login_code enable row level security;
