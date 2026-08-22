import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { computeFunnel } from "./funnel";
import { recordInteraction } from "@/server/db/repositories/interaction";

describe("computeFunnel", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("shrinks monotonically: a visitor missing a step doesn't count for any step after it", async () => {
    const client = await getTestPool().connect();
    try {
      // Visitor A: lands, clicks CTA, submits a lead — completes the funnel.
      const a = await simulateVisit(client, { utmSource: "instagram" });
      await recordInteraction(client, { visitorId: a.visitorId, contactId: null, eventName: "landing_view", route: "/entrenar", touch: a.touch });
      await recordInteraction(client, { visitorId: a.visitorId, contactId: null, eventName: "cta_click", route: "/entrenar", touch: a.touch });
      await recordInteraction(client, { visitorId: a.visitorId, contactId: null, eventName: "lead_submitted", route: "/contacto", touch: a.touch });

      // Visitor B: lands and clicks CTA, but never submits a lead.
      const b = await simulateVisit(client, { utmSource: "tiktok" });
      await recordInteraction(client, { visitorId: b.visitorId, contactId: null, eventName: "landing_view", route: "/musica", touch: b.touch });
      await recordInteraction(client, { visitorId: b.visitorId, contactId: null, eventName: "cta_click", route: "/musica", touch: b.touch });

      // Visitor C: just lands, no CTA.
      const c = await simulateVisit(client, { utmSource: "youtube" });
      await recordInteraction(client, { visitorId: c.visitorId, contactId: null, eventName: "landing_view", route: "/shows", touch: c.touch });

      const result = await computeFunnel(
        client,
        [
          { name: "Visit", event: "visit" },
          { name: "Landing view", event: "landing_view" },
          { name: "CTA click", event: "cta_click" },
          { name: "Lead", event: "lead_submitted" },
        ],
        testDateRange(),
      );

      expect(result.map((s) => s.visitors)).toEqual([3, 3, 2, 1]);
      expect(result[0].conversionFromPrevious).toBeNull();
      expect(result[2].conversionFromPrevious).toBeCloseTo(2 / 3);
      expect(result[3].conversionFromFirst).toBeCloseTo(1 / 3);
    } finally {
      client.release();
    }
  });

  it("returns zero counts, not an error, for a funnel with no matching activity", async () => {
    const result = await computeFunnel(
      getTestPool(),
      [{ name: "Purchase", event: "purchase" }],
      testDateRange(),
    );
    expect(result).toEqual([
      { name: "Purchase", event: "purchase", visitors: 0, conversionFromPrevious: null, conversionFromFirst: null },
    ]);
  });
});
