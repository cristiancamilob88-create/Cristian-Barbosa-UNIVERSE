import { env } from "@/lib/env";

/**
 * Builds an absolute, public URL for a route this app serves (a
 * `/bienvenida/[slug]` campaign landing, a QR's destination, any
 * tracked route) from its path alone. Cristian's ask, 2026-09-12: he
 * kept having to ask for the campaign link every time — this lets
 * /admin link straight to the live page instead. Client-safe (reads
 * only `NEXT_PUBLIC_SITE_URL` via src/lib/env.ts, never `process.env`
 * directly, per this repo's env rule) — used from Client Components.
 */
export function toPublicUrl(path: string): string {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
