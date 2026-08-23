import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, testDateRange } from "@/server/db/testHelpers.integration";
import { getCustomerSummary, getSubscriptionSummary } from "./commerce";

describe("getCustomerSummary", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("counts distinct paying contacts, not total orders", async () => {
    const client = await getTestPool().connect();
    try {
      const contact = await client.query("insert into contact (email) values ($1) returning id", [
        `customer-${Date.now()}@example.com`,
      ]);
      const contactId = contact.rows[0].id;

      // Two paid orders, same contact — should still count as one customer.
      await client.query("insert into orders (contact_id, status, total_cents, paid_at) values ($1, 'paid', 10000, now())", [
        contactId,
      ]);
      await client.query("insert into orders (contact_id, status, total_cents, paid_at) values ($1, 'paid', 20000, now())", [
        contactId,
      ]);

      const summary = await getCustomerSummary(client, testDateRange());
      expect(summary.total).toBe(1);
    } finally {
      client.release();
    }
  });

  it("never counts a pending/refunded/cancelled order's contact as a customer", async () => {
    const client = await getTestPool().connect();
    try {
      const contact = await client.query("insert into contact (email) values ($1) returning id", [
        `not-a-customer-${Date.now()}@example.com`,
      ]);
      await client.query("insert into orders (contact_id, status, total_cents) values ($1, 'pending', 10000)", [
        contact.rows[0].id,
      ]);

      const summary = await getCustomerSummary(client, testDateRange());
      expect(summary.total).toBe(0);
    } finally {
      client.release();
    }
  });
});

describe("getSubscriptionSummary", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("counts current subscriptions by status, and started/cancelled activity within range", async () => {
    const client = await getTestPool().connect();
    try {
      const product = await client.query(
        "select id from product where slug = 'facebook-subscription'",
      );
      const productId = product.rows[0].id;

      const contactActive = await client.query("insert into contact (email) values ($1) returning id", [
        `sub-active-${Date.now()}@example.com`,
      ]);
      const contactPaused = await client.query("insert into contact (email) values ($1) returning id", [
        `sub-paused-${Date.now()}@example.com`,
      ]);
      const contactCancelled = await client.query("insert into contact (email) values ($1) returning id", [
        `sub-cancelled-${Date.now()}@example.com`,
      ]);

      await client.query(
        "insert into subscription (contact_id, product_id, provider, status, started_at) values ($1, $2, 'facebook', 'active', now())",
        [contactActive.rows[0].id, productId],
      );
      await client.query(
        "insert into subscription (contact_id, product_id, provider, status, started_at) values ($1, $2, 'facebook', 'paused', now())",
        [contactPaused.rows[0].id, productId],
      );
      await client.query(
        `insert into subscription (contact_id, product_id, provider, status, started_at, cancelled_at)
         values ($1, $2, 'facebook', 'cancelled', now(), now())`,
        [contactCancelled.rows[0].id, productId],
      );

      const summary = await getSubscriptionSummary(client, testDateRange());
      expect(summary.active).toBe(1);
      expect(summary.paused).toBe(1);
      expect(summary.cancelled).toBe(1);
      expect(summary.startedInRange).toBe(3);
      expect(summary.cancelledInRange).toBe(1);
    } finally {
      client.release();
    }
  });

  it("returns all zeros when there are no subscriptions", async () => {
    const client = await getTestPool().connect();
    try {
      const summary = await getSubscriptionSummary(client, testDateRange());
      expect(summary).toEqual({ active: 0, paused: 0, cancelled: 0, startedInRange: 0, cancelledInRange: 0 });
    } finally {
      client.release();
    }
  });
});
