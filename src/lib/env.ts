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
  // `|| undefined` (not a bare pass-through): a dashboard that lets you
  // save an env var with a blank value produces an empty string, not an
  // absent key — zod's `.default()` only substitutes on `undefined`, so
  // an empty string here would reach `.url()` and fail validation
  // instead of falling back. Same guard src/server/env.ts already uses
  // for its own optional string vars. Found via a real Vercel build
  // failure (Block 08.10, Fase 10): `new URL("")` in src/app/layout.tsx
  // threw `ERR_INVALID_URL` because src/config/site.ts read
  // `process.env.NEXT_PUBLIC_SITE_URL` directly instead of this
  // validated export — see src/config/site.ts's own comment.
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NODE_ENV: process.env.NODE_ENV,
});
