import "server-only";
import { z } from "zod";

/**
 * Validated environment access for server-only variables — the
 * server-side counterpart to src/lib/env.ts (which holds only
 * NEXT_PUBLIC_* vars safe to bundle into the client). Kept in a separate,
 * `server-only`-guarded module so a secret can never end up validated by
 * code a client component might import. See .env.example and
 * docs/SECURITY.md.
 *
 * Validated lazily (via getServerEnv(), not at module import time): a
 * route that never touches the database shouldn't fail `next build`
 * just because some *other* route imports this module. The database
 * pool itself (src/server/db/pool.ts) calls this the first time a
 * request actually needs a connection.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is not set — see .env.example"),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });
}
