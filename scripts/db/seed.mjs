#!/usr/bin/env node
// Applies supabase/seed.sql against DATABASE_URL. Idempotent — safe to
// run more than once (every insert in seed.sql is ON CONFLICT DO NOTHING).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(readFileSync(path.join(rootDir, "supabase/seed.sql"), "utf8"));
    console.log("Seed applied.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
