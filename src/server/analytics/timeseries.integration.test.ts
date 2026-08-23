import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { createLead } from "@/server/db/repositories/lead";
import { getDailySeries } from "./timeseries";

describe("getDailySeries", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("zero-fills every day in range, not just days with activity", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, { utmSource: "instagram" });
      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "page_view",
        route: "/entrenar",
        touch,
      });

      const points = await getDailySeries(client, testDateRange());

      // testDateRange() spans ~90 days — most of them had no activity at
      // all, and must still appear as explicit zero points, not be missing.
      expect(points.length).toBeGreaterThan(60);
      const activeDays = points.filter((p) => p.visitors > 0);
      const zeroDays = points.filter((p) => p.visitors === 0);
      expect(activeDays.length).toBeGreaterThan(0);
      expect(zeroDays.length).toBeGreaterThan(0);
    } finally {
      client.release();
    }
  });

  it("counts today's distinct visitors on today's point — matches the Overview KPI's own 'any event' definition", async () => {
    const client = await getTestPool().connect();
    try {
      const first = await simulateVisit(client, { utmSource: "instagram" });
      const second = await simulateVisit(client, { utmSource: "tiktok" });

      for (const { visitorId, touch } of [first, second]) {
        await recordInteraction(client, { visitorId, contactId: null, eventName: "page_view", route: "/", touch });
      }

      const points = await getDailySeries(client, testDateRange());
      const todayKey = new Date().toISOString().slice(0, 10);
      const today = points.find((p) => p.date === todayKey);

      expect(today?.visitors).toBe(2);
    } finally {
      client.release();
    }
  });

  it("counts one visitor once per day even with several events", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, { utmSource: "instagram" });
      await recordInteraction(client, { visitorId, contactId: null, eventName: "page_view", route: "/", touch });
      await recordInteraction(client, { visitorId, contactId: null, eventName: "cta_click", route: "/entrenar", touch });

      const points = await getDailySeries(client, testDateRange());
      const todayKey = new Date().toISOString().slice(0, 10);
      const today = points.find((p) => p.date === todayKey);

      expect(today?.visitors).toBe(1);
    } finally {
      client.release();
    }
  });

  it("returns points in ascending date order", async () => {
    const client = await getTestPool().connect();
    try {
      const points = await getDailySeries(client, testDateRange());
      const dates = points.map((p) => p.date);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    } finally {
      client.release();
    }
  });

  it("counts a lead on the day it was created", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, { utmSource: "google" });
      const contact = await client.query("insert into contact (email) values ($1) returning id", [
        `timeseries-lead-${Date.now()}@example.com`,
      ]);
      const contactId = contact.rows[0].id;
      await client.query("insert into contact_visitor (visitor_id, contact_id) values ($1, $2)", [visitorId, contactId]);

      await createLead(client, { contactId, interestId: null, topicRaw: "general", message: null, touch });

      const points = await getDailySeries(client, testDateRange());
      const todayKey = new Date().toISOString().slice(0, 10);
      const today = points.find((p) => p.date === todayKey);

      expect(today?.leads).toBe(1);
    } finally {
      client.release();
    }
  });

  it("counts a paid order's revenue on the day it was paid, not created", async () => {
    const client = await getTestPool().connect();
    try {
      const contact = await client.query(
        "insert into contact (email) values ($1) returning id",
        [`timeseries-${Date.now()}@example.com`],
      );
      await client.query(
        "insert into orders (contact_id, status, total_cents, paid_at) values ($1, 'paid', 25000, now()) returning id",
        [contact.rows[0].id],
      );

      const points = await getDailySeries(client, testDateRange());
      const todayKey = new Date().toISOString().slice(0, 10);
      const today = points.find((p) => p.date === todayKey);

      expect(today?.purchases).toBe(1);
      expect(today?.revenueCents).toBe(25000);
    } finally {
      client.release();
    }
  });
});
