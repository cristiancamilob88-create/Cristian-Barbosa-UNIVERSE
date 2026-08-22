-- test-auth-shim.sql — LOCAL/CI TEST ONLY. Never run against Supabase.
--
-- Supabase provisions `anon`/`authenticated`/`service_role` roles and an
-- `auth.uid()` function automatically; a plain Postgres instance (local
-- dev, CI service container) has neither. This script recreates just
-- enough of that surface so 0002_rls_policies.sql applies cleanly and its
-- policies are actually testable outside Supabase. It is intentionally
-- kept out of supabase/migrations/ — it is not part of what ships to a
-- real project.

do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

create schema if not exists auth;

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;
