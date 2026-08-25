import { describe, it, expect, vi } from "vitest";

/**
 * Regression coverage for the real Vercel build failure found in Block
 * 08.10, Fase 10: `NEXT_PUBLIC_SITE_URL` saved with a blank value (an
 * empty string, not an absent key) reached `new URL("")` in
 * src/app/layout.tsx and crashed the entire build with `ERR_INVALID_URL`
 * — confirmed against the real deployment's build log via the Vercel MCP
 * connector, not guessed.
 *
 * Isolated in its own file (fresh module registry per test) since
 * src/lib/env.ts validates eagerly at import time — every other test file
 * that imports anything importing it would otherwise see whatever value
 * ran first.
 */
describe("src/lib/env.ts — NEXT_PUBLIC_SITE_URL", () => {
  it("falls back to the default when the env var is an empty string, not just when it's unset", async () => {
    vi.resetModules();
    const original = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "";
    try {
      const { env } = await import("./env");
      expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://cristianbarbosa.com");
    } finally {
      if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = original;
    }
  });

  it("falls back to the default when the env var is entirely unset", async () => {
    vi.resetModules();
    const original = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    try {
      const { env } = await import("./env");
      expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://cristianbarbosa.com");
    } finally {
      if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = original;
    }
  });

  it("uses a real configured value when one is set", async () => {
    vi.resetModules();
    const original = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    try {
      const { env } = await import("./env");
      expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://example.com");
    } finally {
      if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = original;
    }
  });
});
