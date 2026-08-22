// Shared helpers for the DB-backed integration suite (vitest.integration.config.mts).
// Not itself a test file (no .test. in the name) — imported by the ones that are.
// Requires DATABASE_URL to point at a disposable Postgres with
// `npm run db:setup:test` already applied.
import { randomUUID } from "node:crypto";
import pg, { type PoolClient } from "pg";
import { configurePgTypeParsers } from "./typeParsers";
import { resolveTouch, type ResolvedTouch } from "./repositories/reference";
import { recordVisitorTouch, getVisitor } from "./repositories/visitor";
import { resolveDateRange } from "@/server/analytics/dateRange";

configurePgTypeParsers();

let pool: pg.Pool | null = null;

export function getTestPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — run against a disposable test database only.");
    }
    pool = new pg.Pool({ connectionString, max: 3 });
  }
  return pool;
}

/** Clears every activity/journey table between tests; leaves seeded dictionaries in place. */
export async function resetActivityTables(): Promise<void> {
  await getTestPool().query(
    "truncate table interaction, lead, contact_interest, contact_visitor, contact, visitor restart identity cascade",
  );
}

export async function closeTestPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Simulates a single attributed visit: a fresh visitor, with its
 * first/last-touch resolved and persisted exactly as
 * resolveVisitorContext() would from a real request — used by every
 * analytics integration test to build a controlled, known scenario
 * (test data only, never real records — see docs/ANALYTICS_ENGINE.md,
 * "Testing").
 */
export async function simulateVisit(
  client: PoolClient,
  touch: {
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    utmTerm?: string | null;
    qrSlug?: string | null;
    landingPath?: string | null;
    referrer?: string | null;
  },
  capturedAt: Date = new Date(),
): Promise<{ visitorId: string; touch: ResolvedTouch }> {
  const visitorId = randomUUID();
  const resolved = await resolveTouch(client, {
    utmSource: touch.utmSource ?? null,
    utmMedium: touch.utmMedium ?? null,
    utmCampaign: touch.utmCampaign ?? null,
    utmContent: touch.utmContent ?? null,
    utmTerm: touch.utmTerm ?? null,
    qrSlug: touch.qrSlug ?? null,
    channel: null,
    landingPath: touch.landingPath ?? null,
    referrer: touch.referrer ?? null,
    capturedAt: capturedAt.toISOString(),
  });
  await recordVisitorTouch(client, visitorId, resolved);
  return { visitorId, touch: resolved };
}

export async function getVisitorRow(client: PoolClient, visitorId: string) {
  return getVisitor(client, visitorId);
}

/**
 * A "90d" range whose upper bound is padded a few seconds into the
 * future — test-only. `interaction`/`visitor` timestamps are Postgres
 * server-clock values (`now()` column defaults); a range's `to` bound
 * computed from `new Date()` is Node-process-clock. In this sandboxed
 * environment the two have been observed to drift by small, inconsistent
 * amounts run to run, occasionally placing a just-committed row's
 * server-clock timestamp a few hundred ms past a Node-clock `to` bound
 * captured moments earlier — see the Block 03 report for the flaky-test
 * investigation this came out of. Production code (the real
 * /api/analytics/* routes) never needs this: a dashboard's "last 90 days"
 * has no reason to assume a write completed milliseconds ago.
 */
export function testDateRange(): { from: Date; to: Date } {
  const range = resolveDateRange("90d");
  return { from: range.from, to: new Date(range.to.getTime() + 5000) };
}
