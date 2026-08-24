import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { attemptLogin } from "./loginFlow";
import { hashPassword } from "./password";
import { verifySessionToken } from "./session";
import { resetLoginRateLimit } from "./loginRateLimit";

const REAL_PASSWORD = "cristian-command-center-2026";
const SECRET = "c".repeat(32);

describe("attemptLogin", () => {
  const originalEnv = {
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  afterAll(() => {
    // Assigning `undefined` stringifies to "undefined" instead of
    // deleting the key — restore properly, or a later test/file that
    // reads this var through zod's min-length schema breaks on that
    // stray 9-char string.
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  beforeEach(() => {
    resetLoginRateLimit();
    process.env.ADMIN_PASSWORD_HASH = hashPassword(REAL_PASSWORD);
    process.env.ADMIN_SESSION_SECRET = SECRET;
  });

  it("fails closed when ADMIN_PASSWORD_HASH isn't configured", () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    const result = attemptLogin(REAL_PASSWORD, "1.1.1.1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/no está configurado/i);
  });

  it("fails closed when ADMIN_SESSION_SECRET isn't configured", () => {
    delete process.env.ADMIN_SESSION_SECRET;
    const result = attemptLogin(REAL_PASSWORD, "1.1.1.1");
    expect(result.ok).toBe(false);
  });

  it("issues a valid, verifiable session token for the correct password", () => {
    const result = attemptLogin(REAL_PASSWORD, "1.1.1.1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(verifySessionToken(result.token, SECRET)).toBe(true);
    }
  });

  it("rejects the wrong password", () => {
    const result = attemptLogin("not-the-password", "1.1.1.2");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/incorrecta/i);
  });

  it("rejects a non-string password (e.g. a File from a malformed form submission)", () => {
    const result = attemptLogin(new Blob(["x"]), "1.1.1.3");
    expect(result.ok).toBe(false);
  });

  it("rate-limits repeated attempts from the same IP", () => {
    const ip = "9.9.9.9";
    let lastResult;
    for (let i = 0; i < 6; i++) {
      lastResult = attemptLogin("wrong-every-time", ip);
    }
    expect(lastResult?.ok).toBe(false);
    if (lastResult && !lastResult.ok) {
      expect(lastResult.error).toMatch(/demasiados intentos/i);
    }
  });

  it("does not rate-limit a different IP", () => {
    for (let i = 0; i < 6; i++) attemptLogin("wrong-every-time", "8.8.8.8");
    const result = attemptLogin(REAL_PASSWORD, "8.8.4.4");
    expect(result.ok).toBe(true);
  });

  it("works correctly even when DATABASE_URL isn't set (Vercel readiness — src/server/env.ts)", () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = attemptLogin(REAL_PASSWORD, "5.5.5.5");
      expect(result.ok).toBe(true);
    } finally {
      if (original === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = original;
    }
  });
});
