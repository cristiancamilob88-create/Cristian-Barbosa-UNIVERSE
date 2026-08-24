import "server-only";
import { Pool } from "pg";
import { getServerEnv } from "@/server/env";
import { configurePgTypeParsers } from "./typeParsers";

configurePgTypeParsers();

/**
 * Server-only Postgres pool. The `server-only` import makes any accidental
 * client-component import of this module fail the build instead of
 * shipping a database connection string into the browser bundle — see
 * docs/SECURITY.md.
 *
 * Reused across requests (module state persists per server process) so
 * every route handler shares one small connection pool instead of opening
 * a fresh connection per request.
 */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const { DATABASE_URL } = getServerEnv();
    // DATABASE_URL is optional in the shared schema (src/server/env.ts) —
    // most of that schema's other callers don't need it. This is the one
    // real requirement point: nothing here can proceed without it.
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not set — see .env.example");
    }
    pool = new Pool({ connectionString: DATABASE_URL, max: 5 });
  }
  return pool;
}
