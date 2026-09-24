-- ---------------------------------------------------------------------
-- Security hardening (2026-09-24, Supabase security advisor
-- "function_search_path_mutable"): pin search_path on the two trigger
-- functions from 0001. Neither references a table by name (they only
-- read NEW/OLD and call now()), so behavior is unchanged — this only
-- removes the theoretical path where a role that can create objects in
-- another schema shadows a function these triggers call.

alter function set_updated_at() set search_path = pg_catalog, public;
alter function contact_protect_first_touch() set search_path = pg_catalog, public;
