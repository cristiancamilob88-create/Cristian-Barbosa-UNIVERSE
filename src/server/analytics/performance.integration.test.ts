import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { resolveSourceId, resolveCampaignId, resolveQrId } from "@/server/db/repositories/reference";
import { createLead } from "@/server/db/repositories/lead";
import { resolveInterestId } from "@/server/db/repositories/reference";
import { getPerformanceByDimension } from "./performance";

describe("getPerformanceByDimension", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("counts visitors by their first-touch source, not last-touch", async () => {
    const client = await getTestPool().connect();
    try {
      await simulateVisit(client, { utmSource: "instagram", utmMedium: "social", utmCampaign: "training-2026" });
      await simulateVisit(client, { utmSource: "instagram", utmMedium: "social", utmCampaign: "training-2026" });
      await simulateVisit(client, { utmSource: "tiktok", utmMedium: "social", utmCampaign: "music-launch" });

      const instagramId = await resolveSourceId(client, "instagram");
      const tiktokId = await resolveSourceId(client, "tiktok");

      const rows = await getPerformanceByDimension(client, "source", testDateRange());
      const instagramRow = rows.find((r) => r.key === instagramId);
      const tiktokRow = rows.find((r) => r.key === tiktokId);

      expect(instagramRow?.visitors).toBe(2);
      expect(tiktokRow?.visitors).toBe(1);
      // The dictionary's own (capitalized, human-facing) label, not the slug.
      expect(instagramRow?.label).toBe("Instagram");
    } finally {
      client.release();
    }
  });

  it("rolls up leads and purchases onto the same source row as its visitors", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "whatsapp",
        utmMedium: "referral",
        utmCampaign: "community",
      });

      const contactResult = await client.query(
        "insert into contact (email, first_touch_source_id, first_touch_captured_at) values ($1, $2, now()) returning id",
        [`perf-${Date.now()}@example.com`, touch.sourceId],
      );
      const contactId = contactResult.rows[0].id;
      await client.query("insert into contact_visitor (visitor_id, contact_id) values ($1, $2)", [
        visitorId,
        contactId,
      ]);

      const interestId = await resolveInterestId(client, "community");
      await createLead(client, {
        contactId,
        interestId,
        topicRaw: "general",
        message: null,
        touch,
      });

      const order = await client.query(
        "insert into orders (contact_id, status, total_cents, paid_at) values ($1, 'paid', 15000, now()) returning id",
        [contactId],
      );
      expect(order.rowCount).toBe(1);

      const whatsappId = await resolveSourceId(client, "whatsapp");
      const rows = await getPerformanceByDimension(client, "source", testDateRange());
      const whatsappRow = rows.find((r) => r.key === whatsappId);

      expect(whatsappRow?.visitors).toBe(1);
      expect(whatsappRow?.leads).toBe(1);
      expect(whatsappRow?.purchases).toBe(1);
      expect(whatsappRow?.revenueCents).toBe(15000);
      expect(whatsappRow?.visitorToLeadRate).toBe(1);
      expect(whatsappRow?.leadToPurchaseRate).toBe(1);
    } finally {
      client.release();
    }
  });

  it("groups visitors with no attribution under the direct/null bucket", async () => {
    const client = await getTestPool().connect();
    try {
      await simulateVisit(client, {});
      const rows = await getPerformanceByDimension(client, "source", testDateRange());
      const directRow = rows.find((r) => r.key === null);
      expect(directRow?.label).toBe("direct");
      expect(directRow?.visitors).toBeGreaterThanOrEqual(1);
    } finally {
      client.release();
    }
  });

  it("aggregates by campaign independently of source", async () => {
    const client = await getTestPool().connect();
    try {
      await simulateVisit(client, { utmSource: "instagram", utmCampaign: "aura-2026" });
      await simulateVisit(client, { utmSource: "facebook", utmCampaign: "aura-2026" });

      const auraCampaignId = await resolveCampaignId(client, "aura-2026");
      const rows = await getPerformanceByDimension(client, "campaign", testDateRange());
      const auraRow = rows.find((r) => r.key === auraCampaignId);
      expect(auraRow?.visitors).toBe(2);
    } finally {
      client.release();
    }
  });

  it("aggregates by QR", async () => {
    const client = await getTestPool().connect();
    try {
      await simulateVisit(client, {
        utmSource: "event",
        utmMedium: "qr",
        utmCampaign: "aura-2026",
        qrSlug: "aura-2026-main",
      });

      const qrId = await resolveQrId(client, "aura-2026-main");
      const rows = await getPerformanceByDimension(client, "qr", testDateRange());
      const qrRow = rows.find((r) => r.key === qrId);
      expect(qrRow?.visitors).toBe(1);
      expect(qrRow?.label).toBe("aura-2026-main");
    } finally {
      client.release();
    }
  });

  it("aggregates by medium — a free-text dimension with no dictionary table (Block 04.1)", async () => {
    const client = await getTestPool().connect();
    try {
      await simulateVisit(client, { utmSource: "instagram", utmMedium: "social" });
      await simulateVisit(client, { utmSource: "instagram", utmMedium: "social" });
      await simulateVisit(client, { utmSource: "event", utmMedium: "qr", qrSlug: "aura-2026-main" });

      const rows = await getPerformanceByDimension(client, "medium", testDateRange());
      const socialRow = rows.find((r) => r.key === "social");
      const qrRow = rows.find((r) => r.key === "qr");

      expect(socialRow?.visitors).toBe(2);
      // key IS the label for a free-text dimension — no dictionary join.
      expect(socialRow?.label).toBe("social");
      expect(qrRow?.visitors).toBe(1);
    } finally {
      client.release();
    }
  });

  it("groups medium-less visitors under the direct/null bucket, same as source/campaign/qr", async () => {
    const client = await getTestPool().connect();
    try {
      await simulateVisit(client, {});
      const rows = await getPerformanceByDimension(client, "medium", testDateRange());
      const directRow = rows.find((r) => r.key === null);
      expect(directRow?.label).toBe("direct");
      expect(directRow?.visitors).toBeGreaterThanOrEqual(1);
    } finally {
      client.release();
    }
  });
});
