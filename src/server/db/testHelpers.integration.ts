// Shared helpers for the DB-backed integration suite (vitest.integration.config.mts).
// Not itself a test file (no .test. in the name) — imported by the ones that are.
// Requires DATABASE_URL to point at a disposable Postgres with
// `npm run db:setup:test` already applied.
import pg from "pg";
import { configurePgTypeParsers } from "./typeParsers";

configurePgTypeParsers();

let pool: pg.Pool | null = null;

export function getTestPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — run against a disposable test database only.");
    }
    pool = new pg.Pool({ connectionString, max: 3 });
  }
  return pool;
}

/** Clears every activity/journey table between tests; leaves seeded dictionaries in place. */
export async function resetActivityTables(): Promise<void> {
  await getTestPool().query(
    "truncate table interaction, lead, contact_interest, contact_visitor, contact, visitor restart identity cascade",
  );
}

export async function closeTestPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
