import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { getEventCounts, getLandingPerformance, getCtaPerformance } from "./engagement";
import { recordInteraction } from "@/server/db/repositories/interaction";

/** Inserts an interaction with an explicit created_at, to control dwell-time gaps precisely — same pattern as sessions.integration.test.ts. */
async function insertInteractionAt(
  client: import("pg").PoolClient,
  visitorId: string,
  eventName: "page_view" | "landing_view" | "cta_click",
  route: string,
  at: Date,
) {
  await client.query(
    `insert into interaction (visitor_id, event_name, route, created_at) values ($1, $2, $3, $4)`,
    [visitorId, eventName, route, at.toISOString()],
  );
}

describe("getEventCounts", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("returns every taxonomy event, zero-filled when absent", async () => {
    const rows = await getEventCounts(getTestPool(), testDateRange());
    expect(rows.find((r) => r.eventName === "purchase")).toEqual({
      eventName: "purchase",
      count: 0,
      uniqueVisitors: 0,
    });
  });

  it("counts events and distinct visitors correctly", async () => {
    const client = await getTestPool().connect();
    try {
      const visit1 = await simulateVisit(client, { utmSource: "instagram" }, new Date());
      const visit2 = await simulateVisit(client, { utmSource: "tiktok" }, new Date());

      await recordInteraction(client, {
        visitorId: visit1.visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/entrenar",
        touch: visit1.touch,
      });
      await recordInteraction(client, {
        visitorId: visit1.visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/entrenar",
        touch: visit1.touch,
      });
      await recordInteraction(client, {
        visitorId: visit2.visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/musica",
        touch: visit2.touch,
      });

      const rows = await getEventCounts(client, testDateRange());
      const ctaRow = rows.find((r) => r.eventName === "cta_click");
      expect(ctaRow).toEqual({ eventName: "cta_click", count: 3, uniqueVisitors: 2 });
    } finally {
      client.release();
    }
  });
});

describe("getLandingPerformance", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("attributes lead/purchase conversion to the contact's first-touch landing path, not the lead route", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "instagram",
        landingPath: "/entrenar",
      });

      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "landing_view",
        route: "/entrenar",
        touch,
      });
      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/entrenar",
        touch,
      });

      const contactResult = await client.query(
        `insert into contact (email, first_touch_landing_path, first_touch_captured_at)
         values ($1, '/entrenar', now()) returning id`,
        [`landing-${Date.now()}@example.com`],
      );
      const contactId = contactResult.rows[0].id;

      await client.query(
        "insert into lead (contact_id, topic_raw) values ($1, 'entrenar')",
        [contactId],
      );

      const rows = await getLandingPerformance(client, testDateRange());
      const entrenarRow = rows.find((r) => r.route === "/entrenar");

      expect(entrenarRow?.views).toBe(1);
      expect(entrenarRow?.ctaClicks).toBe(1);
      expect(entrenarRow?.leadConversions).toBe(1);
    } finally {
      client.release();
    }
  });

  it("computes average dwell time from the gap to each visitor's next interaction", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId } = await simulateVisit(client, { utmSource: "instagram" });
      const base = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago, safely inside every preset

      // 90 seconds on /entrenar before clicking a CTA there, then 45
      // seconds on /musica before the trail ends (no "next" event —
      // excluded, not counted as 0).
      await insertInteractionAt(client, visitorId, "landing_view", "/entrenar", base);
      await insertInteractionAt(client, visitorId, "cta_click", "/entrenar", new Date(base.getTime() + 90_000));
      await insertInteractionAt(client, visitorId, "page_view", "/musica", new Date(base.getTime() + 90_000 + 45_000));

      const rows = await getLandingPerformance(client, testDateRange());
      const entrenarRow = rows.find((r) => r.route === "/entrenar");
      const musicaRow = rows.find((r) => r.route === "/musica");

      expect(entrenarRow?.avgDwellSeconds).toBe(90);
      expect(musicaRow?.avgDwellSeconds).toBeNull();
    } finally {
      client.release();
    }
  });

  it("excludes a gap over the 30-minute session threshold from dwell time", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId } = await simulateVisit(client, { utmSource: "instagram" });
      const base = new Date(Date.now() - 60 * 60 * 1000);

      await insertInteractionAt(client, visitorId, "landing_view", "/entrenar", base);
      // 31 minutes later — a tab left open, not real reading time.
      await insertInteractionAt(client, visitorId, "page_view", "/musica", new Date(base.getTime() + 31 * 60_000));

      const rows = await getLandingPerformance(client, testDateRange());
      const entrenarRow = rows.find((r) => r.route === "/entrenar");
      expect(entrenarRow?.avgDwellSeconds).toBeNull();
    } finally {
      client.release();
    }
  });
});

describe("getCtaPerformance", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("groups clicks by (cta, route), not just a single total", async () => {
    const client = await getTestPool().connect();
    try {
      const visit1 = await simulateVisit(client, { utmSource: "instagram" });
      const visit2 = await simulateVisit(client, { utmSource: "tiktok" });

      // Same `cta` id, two different pages — a real shape (e.g.
      // "ver_universo_completo" on multiple routes) that a single total
      // can't tell apart.
      await recordInteraction(client, {
        visitorId: visit1.visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/bienvenida/concordia-2026",
        touch: visit1.touch,
        metadata: { cta: "ver_universo_completo", topic: "general" },
      });
      await recordInteraction(client, {
        visitorId: visit1.visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/bienvenida/concordia-2026",
        touch: visit1.touch,
        metadata: { cta: "ver_universo_completo", topic: "general" },
      });
      await recordInteraction(client, {
        visitorId: visit2.visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/entrenar",
        touch: visit2.touch,
        metadata: { cta: "ver_universo_completo", topic: "general" },
      });

      const rows = await getCtaPerformance(client, testDateRange());

      const bienvenidaRow = rows.find((r) => r.cta === "ver_universo_completo" && r.route === "/bienvenida/concordia-2026");
      expect(bienvenidaRow).toEqual({
        cta: "ver_universo_completo",
        route: "/bienvenida/concordia-2026",
        topic: "general",
        clicks: 2,
        uniqueVisitors: 1,
      });

      const entrenarRow = rows.find((r) => r.cta === "ver_universo_completo" && r.route === "/entrenar");
      expect(entrenarRow).toEqual({
        cta: "ver_universo_completo",
        route: "/entrenar",
        topic: "general",
        clicks: 1,
        uniqueVisitors: 1,
      });
    } finally {
      client.release();
    }
  });

  it("falls back to '(sin id)' when a cta_click carries no cta metadata", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, { utmSource: "instagram" });

      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/entrenar",
        touch,
      });

      const rows = await getCtaPerformance(client, testDateRange());
      const row = rows.find((r) => r.route === "/entrenar");
      expect(row?.cta).toBe("(sin id)");
    } finally {
      client.release();
    }
  });
});
