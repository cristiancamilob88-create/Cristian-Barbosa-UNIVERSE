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
 *
 * DATABASE_URL is optional *in this schema* even though every DB-backed
 * route needs it — three real call sites (isValidAdminSessionToken(),
 * attemptLogin(), requireAnalyticsAuth()) call getServerEnv() but only
 * ever read ADMIN_SESSION_SECRET/ADMIN_PASSWORD_HASH/ANALYTICS_API_TOKEN,
 * all already `.optional()` here with their own "not configured yet"
 * fallback. Before this was optional, any one of those three would throw
 * this schema's own DATABASE_URL error whenever DATABASE_URL happened to
 * be unset — e.g. a freshly-imported Vercel project with no env vars
 * configured yet, where visiting /admin/login should say "not
 * configured," not crash with an unrelated validation error. The real
 * requirement lives where it's actually needed: getPool()
 * (src/server/db/pool.ts) throws its own clear error the moment
 * something really does try to open a connection.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  // Optional on purpose: unset means the /api/analytics/* endpoints stay
  // closed (fail-safe), not open — see docs/SECURITY.md and
  // docs/ANALYTICS_ENGINE.md, "Endpoint authorization". Kept as a second,
  // optional access path (service-to-service/automation callers) now
  // that the admin session (below) is the dashboard's own mechanism —
  // see docs/COMMAND_CENTER.md, "Authentication model".
  ANALYTICS_API_TOKEN: z.string().min(16).optional(),
  // Admin login — a single shared credential (docs/COMMAND_CENTER.md,
  // "Why one shared password"), never stored in plaintext. Generate with
  // `node scripts/admin/hash-password.mjs`. Both optional on purpose:
  // unset means /admin/* fails closed (login always reports "not
  // configured", never accepts a password) instead of silently being
  // open or crashing the build.
  ADMIN_PASSWORD_HASH: z.string().min(10).optional(),
  // Signs/verifies the admin session cookie (HMAC-SHA256, src/server/auth/session.ts).
  // Generate with `openssl rand -hex 32`.
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),
  // Welcome-email automation (2026-08-25, Cristian's own request — see
  // docs/AUTOMATIONS.md), sent via Gmail SMTP: no domain purchase
  // needed to start (Resend/similar require a verified domain to email
  // real recipients, confirmed against Resend's own docs — Gmail SMTP
  // has no such requirement). Both optional: unset means
  // sendWelcomeEmail() skips and logs, never breaks /api/lead's actual
  // job (saving the lead) — same fail-open-for-the-user, fail-closed-
  // for-the-feature posture as every other optional integration here.
  GMAIL_USER: z.string().email().optional(),
  // A Google "App Password" (16 chars, spaces optional) — never
  // Cristian's real Gmail password. Requires 2-Step Verification on
  // first; docs/AUTOMATIONS.md has the exact steps.
  GMAIL_APP_PASSWORD: z.string().min(16).optional(),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    // `|| undefined`, not a bare pass-through — an env var saved with a
    // blank value in a dashboard is an empty string, not absent, and
    // `.optional()` still validates a present-but-empty value against
    // `.min(1)` and throws. Same guard the other three fields already
    // use below; found missing here via a real Vercel build failure
    // (Block 08.10 Fase 10) in the sibling case, src/lib/env.ts's
    // NEXT_PUBLIC_SITE_URL — see that file's comment.
    DATABASE_URL: process.env.DATABASE_URL || undefined,
    ANALYTICS_API_TOKEN: process.env.ANALYTICS_API_TOKEN || undefined,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || undefined,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || undefined,
    GMAIL_USER: process.env.GMAIL_USER || undefined,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || undefined,
  });
}
