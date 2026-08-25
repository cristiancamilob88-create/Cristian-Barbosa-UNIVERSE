import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { getServerEnv } from "./env";

/**
 * Regression coverage for the empty-string class of bug found in Block
 * 08.10, Fase 10 (the real Vercel build failure — see src/lib/env.test.ts
 * for the sibling NEXT_PUBLIC_SITE_URL case that was actually observed in
 * production). A dashboard that lets you save an env var with a blank
 * value produces `""`, not an absent key — `.optional()` alone still
 * validates a present-but-empty string against `.min(n)` and throws.
 */
describe("getServerEnv — empty-string env vars behave like unset ones", () => {
  const original = {
    DATABASE_URL: process.env.DATABASE_URL,
    ANALYTICS_API_TOKEN: process.env.ANALYTICS_API_TOKEN,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  afterAll(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.ANALYTICS_API_TOKEN;
    delete process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_SESSION_SECRET;
  });

  it("does not throw when DATABASE_URL is an empty string", () => {
    process.env.DATABASE_URL = "";
    expect(() => getServerEnv()).not.toThrow();
    expect(getServerEnv().DATABASE_URL).toBeUndefined();
  });

  it("still accepts a real DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgres://user:pass@host:5432/db";
    expect(getServerEnv().DATABASE_URL).toBe("postgres://user:pass@host:5432/db");
  });
});
