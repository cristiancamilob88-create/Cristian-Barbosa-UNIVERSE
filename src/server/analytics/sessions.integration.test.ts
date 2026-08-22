import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { getSessionSummary } from "./sessions";

/** Inserts an interaction with an explicit created_at, to control session gaps precisely. */
async function insertInteractionAt(
  client: import("pg").PoolClient,
  visitorId: string,
  route: string,
  at: Date,
) {
  await client.query(
    `insert into interaction (visitor_id, event_name, route, created_at) values ($1, 'page_view', $2, $3)`,
    [visitorId, route, at.toISOString()],
  );
}

describe("getSessionSummary", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("groups events less than 30 minutes apart into one session", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId } = await simulateVisit(client, { utmSource: "instagram" });
      const base = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago, safely inside every preset

      await insertInteractionAt(client, visitorId, "/", base);
      await insertInteractionAt(client, visitorId, "/entrenar", new Date(base.getTime() + 5 * 60_000));
      await insertInteractionAt(client, visitorId, "/comunidad", new Date(base.getTime() + 10 * 60_000));

      const summary = await getSessionSummary(client, testDateRange());
      expect(summary.sessions).toBe(1);
      expect(summary.visitors).toBe(1);
      expect(summary.avgPagesPerSession).toBe(3);
      expect(summary.avgDurationSeconds).toBe(10 * 60);
    } finally {
      client.release();
    }
  });

  it("starts a new session after a 30+ minute gap", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId } = await simulateVisit(client, { utmSource: "instagram" });
      const base = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago, safely inside every preset

      await insertInteractionAt(client, visitorId, "/", base);
      // 31 minutes later — a new session.
      await insertInteractionAt(client, visitorId, "/entrenar", new Date(base.getTime() + 31 * 60_000));

      const summary = await getSessionSummary(client, testDateRange());
      expect(summary.sessions).toBe(2);
      expect(summary.visitors).toBe(1);
      expect(summary.avgPagesPerSession).toBe(1);
    } finally {
      client.release();
    }
  });

  it("counts sessions independently per visitor", async () => {
    const client = await getTestPool().connect();
    try {
      const v1 = await simulateVisit(client, { utmSource: "instagram" });
      const v2 = await simulateVisit(client, { utmSource: "tiktok" });
      const base = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago, safely inside every preset

      await insertInteractionAt(client, v1.visitorId, "/", base);
      await insertInteractionAt(client, v2.visitorId, "/musica", base);

      const summary = await getSessionSummary(client, testDateRange());
      expect(summary.sessions).toBe(2);
      expect(summary.visitors).toBe(2);
    } finally {
      client.release();
    }
  });
});
