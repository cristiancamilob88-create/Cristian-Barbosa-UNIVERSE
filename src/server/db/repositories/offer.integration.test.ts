import { afterAll, describe, expect, it } from "vitest";
import { getTestPool, closeTestPool } from "@/server/db/testHelpers.integration";
import { getActiveOfferBySlug, listActiveOffersByProduct } from "./offer";

describe("getActiveOfferBySlug", () => {
  afterAll(closeTestPool);

  it("returns the seeded digital-course-standard offer with the new checkout columns", async () => {
    const offer = await getActiveOfferBySlug(getTestPool(), "digital-course-standard");
    expect(offer).not.toBeNull();
    expect(offer?.name).toBe("Curso digital");
    // Defaults from 0005_commerce_infrastructure.sql, applied to already-existing rows.
    expect(offer?.checkoutProvider).toBe("unavailable");
    expect(offer?.purchaseType).toBe("one_time");
    expect(offer?.checkoutUrl).toBeNull();
    expect(offer?.metadata).toEqual({});
  });

  it("returns null for an unknown slug", async () => {
    const offer = await getActiveOfferBySlug(getTestPool(), "does-not-exist");
    expect(offer).toBeNull();
  });

  it("returns null for an inactive offer, never a checkout for something not for sale", async () => {
    const client = await getTestPool().connect();
    try {
      const product = await client.query(
        "insert into product (slug, name, kind) values ($1, 'Test product', 'digital') returning id",
        [`test-product-${Date.now()}`],
      );
      const slug = `test-offer-${Date.now()}`;
      await client.query("insert into offer (product_id, slug, name, active) values ($1, $2, 'Test offer', false)", [
        product.rows[0].id,
        slug,
      ]);

      const offer = await getActiveOfferBySlug(client, slug);
      expect(offer).toBeNull();
    } finally {
      client.release();
    }
  });
});

describe("listActiveOffersByProduct", () => {
  afterAll(closeTestPool);

  it("lists only active offers for a product, ignoring inactive ones", async () => {
    const client = await getTestPool().connect();
    try {
      const product = await client.query(
        "insert into product (slug, name, kind) values ($1, 'Multi-offer product', 'coaching') returning id",
        [`multi-offer-product-${Date.now()}`],
      );
      const productId = product.rows[0].id;

      await client.query("insert into offer (product_id, slug, name, active) values ($1, $2, 'Active offer', true)", [
        productId,
        `active-offer-${Date.now()}`,
      ]);
      await client.query("insert into offer (product_id, slug, name, active) values ($1, $2, 'Inactive offer', false)", [
        productId,
        `inactive-offer-${Date.now()}`,
      ]);

      const offers = await listActiveOffersByProduct(client, productId);
      expect(offers).toHaveLength(1);
      expect(offers[0].name).toBe("Active offer");
    } finally {
      client.release();
    }
  });
});
