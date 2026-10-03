-- 0019_exercise_library.sql — exercise library (Plan Diciembre, 2026-10-03,
-- Cristian's request: students look up how to do an exercise when he
-- isn't there — steps, common mistakes and his own video).
--
-- A routine exercise can point at a library entry (`exerciseId` inside
-- the routine JSON, src/lib/training.ts); the library itself is
-- program-agnostic so any future program reuses it.

create table exercise (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  muscle_group text not null
    check (muscle_group in ('pecho', 'espalda', 'abdomen', 'triceps', 'pierna', 'cuerpo_completo', 'skills', 'movilidad')),
  -- "Cómo se hace": short steps, Cristian's words.
  description text check (char_length(description) <= 2000),
  common_mistakes text check (char_length(common_mistakes) <= 1000),
  -- Where it sits in a skill's progression, free text ("Dominada · paso 2 de 4").
  progression text check (char_length(progression) <= 120),
  -- An external video link (YouTube unlisted, Instagram…) …
  video_url text check (char_length(video_url) <= 500),
  -- … and/or a video uploaded to Supabase Storage (bucket exercise-videos).
  video_path text check (char_length(video_path) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index exercise_name_unique on exercise (lower(name));
create index exercise_group_idx on exercise (muscle_group, name);

comment on table exercise is
  'Exercise library: how-to steps, common mistakes, progression and a video per exercise — what a student opens from their routine when Cristian is not there (docs/TRAINING.md).';

-- Same deny-by-default convention as every business table: only the
-- server-only connection reads/writes it.
alter table exercise enable row level security;

-- Public bucket for the exercise videos. Supabase-only (the `storage`
-- schema doesn't exist on a plain local/CI Postgres), so it's guarded.
-- Public read is deliberate: these are demo clips of a movement, shown in
-- a <video> tag; uploads only ever happen through a signed URL the server
-- issues to the admin (src/server/storage/exerciseVideos.ts).
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('exercise-videos', 'exercise-videos', true, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
    on conflict (id) do nothing;
  end if;
end $$;
