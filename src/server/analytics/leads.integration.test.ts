import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit, testDateRange } from "@/server/db/testHelpers.integration";
import { resolveInterestId } from "@/server/db/repositories/reference";
import { createLead } from "@/server/db/repositories/lead";
import { getRecentLeads } from "./leads";

describe("getRecentLeads", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("returns one row per lead, most recent first, with no PII", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, {
        utmSource: "instagram",
        utmMedium: "social",
        utmCampaign: "training-2026",
      });

      const email = `recent-lead-${Date.now()}@example.com`;
      const contact = await client.query(
        "insert into contact (email, first_name, last_name, phone) values ($1, 'Secret', 'Person', '+573000000000') returning id",
        [email],
      );
      const contactId = contact.rows[0].id;
      await client.query("insert into contact_visitor (visitor_id, contact_id) values ($1, $2)", [visitorId, contactId]);

      const interestId = await resolveInterestId(client, "training");
      const lead = await createLead(client, {
        contactId,
        interestId,
        topicRaw: "entrenar",
        message: null,
        touch,
      });

      const rows = await getRecentLeads(client, testDateRange());
      const row = rows.find((r) => r.id === lead.id);

      expect(row).toBeDefined();
      expect(row?.topicRaw).toBe("entrenar");
      expect(row?.interestLabel).toBe("Entrenamiento");
      expect(row?.sourceLabel).toBe("Instagram");
      // Not a seeded campaign — resolveCampaignId() find-or-creates it,
      // with `name` defaulting to the raw slug (reference.ts).
      expect(row?.campaignLabel).toBe("training-2026");
      expect(row?.medium).toBe("social");
    } finally {
      client.release();
    }
  });

  it("carries medium (Block 04.1 — lead.medium) and never a contact's name/email", async () => {
    const client = await getTestPool().connect();
    try {
      const { visitorId, touch } = await simulateVisit(client, { utmSource: "whatsapp", utmMedium: "referral" });

      const email = `no-pii-${Date.now()}@example.com`;
      const contact = await client.query("insert into contact (email, first_name) values ($1, 'ShouldNotAppear') returning id", [
        email,
      ]);
      const contactId = contact.rows[0].id;
      await client.query("insert into contact_visitor (visitor_id, contact_id) values ($1, $2)", [visitorId, contactId]);

      await createLead(client, { contactId, interestId: null, topicRaw: "general", message: null, touch });

      const rows = await getRecentLeads(client, testDateRange());
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].medium).toBe("referral");

      const serialized = JSON.stringify(rows);
      expect(serialized).not.toContain(email);
      expect(serialized).not.toContain("ShouldNotAppear");
      expect(serialized).not.toContain(contactId);
    } finally {
      client.release();
    }
  });

  it("orders most-recent-first and respects the limit", async () => {
    const client = await getTestPool().connect();
    try {
      for (let i = 0; i < 3; i++) {
        const { visitorId, touch } = await simulateVisit(client, { utmSource: "google" });
        const contact = await client.query("insert into contact (email) values ($1) returning id", [
          `order-${i}-${Date.now()}@example.com`,
        ]);
        const contactId = contact.rows[0].id;
        await client.query("insert into contact_visitor (visitor_id, contact_id) values ($1, $2)", [visitorId, contactId]);
        await createLead(client, { contactId, interestId: null, topicRaw: `topic-${i}`, message: null, touch });
      }

      const rows = await getRecentLeads(client, testDateRange(), 2);
      expect(rows).toHaveLength(2);
      // Most recent (topic-2) first.
      expect(rows[0].topicRaw).toBe("topic-2");
    } finally {
      client.release();
    }
  });
});
