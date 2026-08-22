import { z } from "zod";

/**
 * Validated environment access. Every env var this app actually reads is
 * declared here once, with a schema — an app that fails to build with a
 * clear message beats one that silently ships `undefined` into a form
 * handler or an analytics key. Nothing here is a secret: see .env.example
 * for the full list and docs/ARCHITECTURE.md (Security) for why secrets
 * never live in this repo.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://cristianbarbosa.com"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
});
