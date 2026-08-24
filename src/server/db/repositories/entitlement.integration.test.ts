import { afterAll, describe, expect, it } from "vitest";
import { getTestPool, closeTestPool } from "@/server/db/testHelpers.integration";
import { grantEntitlement, hasEntitlement } from "./entitlement";

async function seedContact(client: import("pg").PoolClient, email: string) {
  const result = await client.query("insert into contact (email, name) values ($1, 'Test Contact') returning id", [
    email,
  ]);
  return result.rows[0].id as string;
}

async function seedProduct(client: import("pg").PoolClient, slug: string) {
  const result = await client.query(
    "insert into product (slug, name, kind) values ($1, 'Test Song', 'music') returning id",
    [slug],
  );
  return result.rows[0].id as string;
}

describe("entitlement (Block 08 — access after confirmed purchase)", () => {
  afterAll(closeTestPool);

  it("hasEntitlement is false before any grant, true after", async () => {
    const client = await getTestPool().connect();
    try {
      const contactId = await seedContact(client, `ent-${Date.now()}@example.com`);
      const productId = await seedProduct(client, `song-${Date.now()}`);

      expect(await hasEntitlement(client, contactId, productId)).toBe(false);

      await grantEntitlement(client, { contactId, productId });

      expect(await hasEntitlement(client, contactId, productId)).toBe(true);
    } finally {
      client.release();
    }
  });

  it("granting twice for the same contact+product is idempotent, not a duplicate row", async () => {
    const client = await getTestPool().connect();
    try {
      const contactId = await seedContact(client, `dup-${Date.now()}@example.com`);
      const productId = await seedProduct(client, `song-dup-${Date.now()}`);

      await grantEntitlement(client, { contactId, productId });
      await grantEntitlement(client, { contactId, productId });

      const rows = await client.query("select count(*) from entitlement where contact_id = $1", [contactId]);
      expect(Number(rows.rows[0].count)).toBe(1);
    } finally {
      client.release();
    }
  });

  it("does not grant access to a different product the contact never purchased", async () => {
    const client = await getTestPool().connect();
    try {
      const contactId = await seedContact(client, `scoped-${Date.now()}@example.com`);
      const purchasedProductId = await seedProduct(client, `song-a-${Date.now()}`);
      const otherProductId = await seedProduct(client, `song-b-${Date.now()}`);

      await grantEntitlement(client, { contactId, productId: purchasedProductId });

      expect(await hasEntitlement(client, contactId, purchasedProductId)).toBe(true);
      expect(await hasEntitlement(client, contactId, otherProductId)).toBe(false);
    } finally {
      client.release();
    }
  });

  it("records the granting order_id when provided", async () => {
    const client = await getTestPool().connect();
    try {
      const contactId = await seedContact(client, `order-${Date.now()}@example.com`);
      const productId = await seedProduct(client, `song-order-${Date.now()}`);
      const order = await client.query(
        "insert into orders (contact_id, status) values ($1, 'paid') returning id",
        [contactId],
      );

      const entitlement = await grantEntitlement(client, { contactId, productId, orderId: order.rows[0].id });
      expect(entitlement.orderId).toBe(order.rows[0].id);
    } finally {
      client.release();
    }
  });
});
