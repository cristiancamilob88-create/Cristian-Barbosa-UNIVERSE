import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "@/server/db/testHelpers.integration";
import { getRecentContactLeads } from "./contacts";

describe("getRecentContactLeads", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("returns real contact detail — name/email/phone — alongside the lead's topic/status", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `contact-${Date.now()}@example.com`;
      const contactResult = await client.query(
        `insert into contact (name, email, phone, first_touch_landing_path, first_touch_captured_at)
         values ('Ana Ramírez', $1, '+573001234567', '/entrenar', now())
         returning id`,
        [email],
      );
      const contactId = contactResult.rows[0].id;

      await client.query(
        `insert into lead (contact_id, topic_raw, message, status) values ($1, 'entrenar', 'Quiero empezar ya', 'new')`,
        [contactId],
      );

      const rows = await getRecentContactLeads(client);
      const row = rows.find((r) => r.contactEmail === email);

      expect(row).toBeDefined();
      expect(row?.contactName).toBe("Ana Ramírez");
      expect(row?.contactPhone).toBe("+573001234567");
      expect(row?.topicRaw).toBe("entrenar");
      expect(row?.message).toBe("Quiero empezar ya");
      expect(row?.status).toBe("new");
    } finally {
      client.release();
    }
  });

  it("orders by most recent lead first", async () => {
    const client = await getTestPool().connect();
    try {
      const older = await client.query(
        `insert into contact (email, first_touch_captured_at) values ($1, now()) returning id`,
        [`older-${Date.now()}@example.com`],
      );
      const newer = await client.query(
        `insert into contact (email, first_touch_captured_at) values ($1, now()) returning id`,
        [`newer-${Date.now()}@example.com`],
      );

      await client.query(
        `insert into lead (contact_id, topic_raw, created_at) values ($1, 'entrenar', now() - interval '1 hour')`,
        [older.rows[0].id],
      );
      await client.query(`insert into lead (contact_id, topic_raw, created_at) values ($1, 'musica', now())`, [
        newer.rows[0].id,
      ]);

      const rows = await getRecentContactLeads(client);
      expect(rows[0].topicRaw).toBe("musica");
    } finally {
      client.release();
    }
  });

  it("respects the limit parameter", async () => {
    const client = await getTestPool().connect();
    try {
      for (let i = 0; i < 3; i++) {
        const contact = await client.query(
          `insert into contact (email, first_touch_captured_at) values ($1, now()) returning id`,
          [`limit-${Date.now()}-${i}@example.com`],
        );
        await client.query(`insert into lead (contact_id, topic_raw) values ($1, 'entrenar')`, [contact.rows[0].id]);
      }

      const rows = await getRecentContactLeads(client, 2);
      expect(rows.length).toBe(2);
    } finally {
      client.release();
    }
  });
});
