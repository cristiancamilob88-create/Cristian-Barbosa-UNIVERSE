import "server-only";
import type { Pool, PoolClient } from "pg";

export interface QrDestination {
  slug: string;
  destinationPath: string;
  active: boolean;
}

/**
 * Looks up a registered `qr_source` row by its slug — the read a QR
 * "generate" action needs (destination_path to build the real,
 * attributed URL), distinct from `getQrPerformance()`
 * (`src/server/analytics/qr.ts`, date-ranged, aggregated) and
 * `getActiveQrLanding()` (`src/server/db/repositories/qrSource.ts`,
 * active-only, joined for a personalized greeting). Deliberately not
 * filtered to `active = true`: Cristian may want to reprint a code
 * that's temporarily paused, and the admin table already shows its
 * active/inactive status before he generates anything.
 */
export async function getQrDestination(db: Pool | PoolClient, slug: string): Promise<QrDestination | null> {
  const { rows } = await db.query<{ slug: string; destination_path: string; active: boolean }>(
    `select slug, destination_path, active from qr_source where slug = $1`,
    [slug.trim().toLowerCase()],
  );
  const row = rows[0];
  if (!row) return null;
  return { slug: row.slug, destinationPath: row.destination_path, active: row.active };
}
