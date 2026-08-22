import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * DB-backed integration tests only — requires DATABASE_URL pointing at a
 * disposable Postgres with `npm run db:setup:test` already applied. Kept
 * separate from vitest.config.mts so `npm test` (lint/typecheck/test/build
 * in CI, and any local run) never silently needs a live database.
 */
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.integration.test.ts"],
    // DB round trips are slower than pure unit assertions; sequential
    // avoids fighting over the same rows across parallel test files.
    fileParallelism: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
