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
  /**
   * Google Maps Platform browser key — address autocomplete + map in the
   * shows request form (src/components/forms/AddressAutocomplete.tsx).
   * Optional: unset, the form shows a plain "where is the event" text
   * field instead. A browser key is public by nature (it ships in the
   * page); it's made safe in Google Cloud, not by hiding it — restrict
   * it to this site's domains (HTTP referrers) and to the Maps
   * JavaScript + Places APIs only. See .env.example.
   */
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(20).optional(),
  /** Map ID for the vector map + advanced marker; Google's DEMO_MAP_ID works until a real one is created. */
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: z.string().min(1).default("DEMO_MAP_ID"),
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
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || undefined,
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
});
