import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "@/server/db/testHelpers.integration";
import { getRecentB2bOpportunities } from "./opportunities";

describe("getRecentB2bOpportunities", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("returns real contact detail alongside the opportunity's category/stage/notes", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `promoter-${Date.now()}@example.com`;
      const contactResult = await client.query(
        `insert into contact (name, email, phone, first_touch_captured_at) values ('Laura Gómez', $1, '+573015557788', now()) returning id`,
        [email],
      );
      const contactId = contactResult.rows[0].id;

      await client.query(
        `insert into b2b_opportunity (contact_id, category, notes, estimated_value_cents) values ($1, 'shows', 'Quiere el show para un festival en diciembre', 500000000)`,
        [contactId],
      );

      const rows = await getRecentB2bOpportunities(client);
      const row = rows.find((r) => r.contactEmail === email);

      expect(row).toBeDefined();
      expect(row?.contactName).toBe("Laura Gómez");
      expect(row?.contactPhone).toBe("+573015557788");
      expect(row?.category).toBe("shows");
      expect(row?.stage).toBe("lead"); // default, per the schema's own default
      expect(row?.notes).toBe("Quiere el show para un festival en diciembre");
      expect(row?.estimatedValueCents).toBe(500000000);
    } finally {
      client.release();
    }
  });

  it("orders by most recent opportunity first", async () => {
    const client = await getTestPool().connect();
    try {
      const older = await client.query(
        `insert into contact (email, first_touch_captured_at) values ($1, now()) returning id`,
        [`older-opp-${Date.now()}@example.com`],
      );
      const newer = await client.query(
        `insert into contact (email, first_touch_captured_at) values ($1, now()) returning id`,
        [`newer-opp-${Date.now()}@example.com`],
      );

      await client.query(`insert into b2b_opportunity (contact_id, category, created_at) values ($1, 'shows', now() - interval '1 hour')`, [
        older.rows[0].id,
      ]);
      await client.query(`insert into b2b_opportunity (contact_id, category, created_at) values ($1, 'brands', now())`, [
        newer.rows[0].id,
      ]);

      const rows = await getRecentB2bOpportunities(client);
      expect(rows[0].category).toBe("brands");
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
          [`limit-opp-${Date.now()}-${i}@example.com`],
        );
        await client.query(`insert into b2b_opportunity (contact_id, category) values ($1, 'shows')`, [contact.rows[0].id]);
      }

      const rows = await getRecentB2bOpportunities(client, 2);
      expect(rows.length).toBe(2);
    } finally {
      client.release();
    }
  });

  it("returns null estimatedValueCents/notes/phone when none was given, not a crash", async () => {
    const client = await getTestPool().connect();
    try {
      const email = `no-value-${Date.now()}@example.com`;
      const contact = await client.query(
        `insert into contact (email, first_touch_captured_at) values ($1, now()) returning id`,
        [email],
      );
      await client.query(`insert into b2b_opportunity (contact_id, category) values ($1, 'sponsors')`, [contact.rows[0].id]);

      const rows = await getRecentB2bOpportunities(client);
      const row = rows.find((r) => r.contactEmail === email);

      expect(row).toBeDefined();
      expect(row?.category).toBe("sponsors");
      expect(row?.contactPhone).toBeNull();
      expect(row?.estimatedValueCents).toBeNull();
      expect(row?.notes).toBeNull();
    } finally {
      client.release();
    }
  });
});
