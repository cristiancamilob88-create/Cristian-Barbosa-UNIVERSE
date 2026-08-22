#!/usr/bin/env node
// One-shot setup for a local/CI test database: test-auth-shim -> migrations
// -> seed. Used by `npm run db:setup:test` and before the integration test
// suite. Never point this at a production database — it is meant for a
// disposable Postgres instance only.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";
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
    console.log("apply test-auth-shim.sql (local/CI only)");
    await client.query(readFileSync(path.join(rootDir, "scripts/db/test-auth-shim.sql"), "utf8"));
  } finally {
    await client.end();
  }

  for (const script of ["migrate.mjs", "seed.mjs"]) {
    execFileSync("node", [path.join(rootDir, "scripts/db", script)], {
      stdio: "inherit",
      env: process.env,
    });
  }

  console.log("Test database ready.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
