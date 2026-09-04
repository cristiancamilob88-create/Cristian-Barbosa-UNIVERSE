import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { recordInteraction } from "@/server/db/repositories/interaction";
import { createLead } from "@/server/db/repositories/lead";
import { resolveInterestId } from "@/server/db/repositories/reference";
import { getCampaignDetail } from "./campaignDetail";

describe("getCampaignDetail", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("rolls up visits, the click funnel, and leads onto the right campaign row, by slug", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "instagram",
        utmMedium: "qr",
        utmCampaign: "concordia-2026",
        qrSlug: "concordia-2026",
        landingPath: "/bienvenida/concordia-2026",
      });

      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "landing_view",
        route: "/bienvenida/concordia-2026",
        touch,
      });
      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "cta_click",
        route: "/bienvenida/concordia-2026",
        touch,
      });
      await recordInteraction(client, {
        visitorId,
        contactId: null,
        eventName: "whatsapp_click",
        route: "/bienvenida/concordia-2026",
        touch,
      });

      const contactResult = await client.query(
        "insert into contact (email, first_touch_campaign_id, first_touch_captured_at) values ($1, $2, now()) returning id",
        [`campaign-detail-${Date.now()}@example.com`, touch.campaignId],
      );
      const contactId = contactResult.rows[0].id;
      const interestId = await resolveInterestId(client, "community");
      await createLead(client, { contactId, interestId, topicRaw: "entrenar", message: null, touch });

      // A second, unrelated campaign — proves the rollup doesn't bleed across rows.
      await simulateVisit(client, { utmSource: "tiktok", utmMedium: "social", utmCampaign: "music-launch" });

      const rows = await getCampaignDetail(client, testDateRange());
      const concordia = rows.find((r) => r.campaignSlug === "concordia-2026");
      const music = rows.find((r) => r.campaignSlug === "music-launch");

      expect(concordia).toBeDefined();
      expect(concordia?.visits).toBe(1);
      expect(concordia?.landingViews).toBe(1);
      expect(concordia?.ctaClicks).toBe(1);
      expect(concordia?.whatsappClicks).toBe(1);
      expect(concordia?.leads).toBe(1);
      expect(concordia?.status).toBe("active");

      expect(music?.visits).toBe(1);
      expect(music?.leads).toBe(0);
    } finally {
      client.release();
    }
  });

  it("includes every registered campaign, even one with zero activity in range", async () => {
    const rows = await getCampaignDetail(getTestPool(), testDateRange());
    const slugs = rows.map((r) => r.campaignSlug);
    // Seeded by supabase/seed.sql, never visited in this test's fresh data.
    expect(slugs).toContain("prueba-interna-2026-08-25");
    const untouched = rows.find((r) => r.campaignSlug === "prueba-interna-2026-08-25");
    expect(untouched?.visits).toBe(0);
    expect(untouched?.leads).toBe(0);
  });
});
