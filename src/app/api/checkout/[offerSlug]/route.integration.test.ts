import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool } from "@/server/db/testHelpers.integration";
import { GET } from "./route";

function makeRequest(offerSlug: string, cookie = ""): NextRequest {
  return new NextRequest(`https://cristianbarbosa.test/api/checkout/${offerSlug}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe("GET /api/checkout/[offerSlug]", () => {
  beforeEach(resetActivityTables);
  afterAll(closeTestPool);

  it("redirects a real but checkout-less offer to the /contacto quote fallback and records checkout_started", async () => {
    const response = await GET(makeRequest("digital-course-standard"), {
      params: Promise.resolve({ offerSlug: "digital-course-standard" }),
    });
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/contacto");
    expect(location).toContain("offer=digital-course-standard");

    const rows = await getTestPool().query(
      "select event_name, entity_type, entity_id, metadata from interaction where event_name = 'checkout_started'",
    );
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].entity_type).toBe("offer");
    expect(rows.rows[0].metadata).toMatchObject({ offerSlug: "digital-course-standard", checkoutKind: "quote" });
  });

  it("redirects straight to a real external checkout_url when the offer has one configured", async () => {
    const client = await getTestPool().connect();
    let offerSlug: string;
    try {
      const product = await client.query(
        "insert into product (slug, name, kind) values ($1, 'External checkout product', 'digital') returning id",
        [`ext-product-${Date.now()}`],
      );
      offerSlug = `ext-offer-${Date.now()}`;
      await client.query(
        `insert into offer (product_id, slug, name, active, checkout_provider, checkout_url)
         values ($1, $2, 'External offer', true, 'hotmart', 'https://pay.hotmart.com/EXTERNAL123')`,
        [product.rows[0].id, offerSlug],
      );
    } finally {
      client.release();
    }

    const response = await GET(makeRequest(offerSlug), { params: Promise.resolve({ offerSlug }) });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://pay.hotmart.com/EXTERNAL123");
  });

  it("falls back to /productos for an unknown offer slug, without crashing or recording anything", async () => {
    const response = await GET(makeRequest("does-not-exist"), {
      params: Promise.resolve({ offerSlug: "does-not-exist" }),
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/productos");

    const rows = await getTestPool().query("select count(*) from interaction");
    expect(Number(rows.rows[0].count)).toBe(0);
  });

  it("falls back to /productos for an inactive offer, never a checkout for something not for sale", async () => {
    const client = await getTestPool().connect();
    let offerSlug: string;
    try {
      const product = await client.query(
        "insert into product (slug, name, kind) values ($1, 'Inactive product', 'digital') returning id",
        [`inactive-product-${Date.now()}`],
      );
      offerSlug = `inactive-offer-${Date.now()}`;
      await client.query("insert into offer (product_id, slug, name, active) values ($1, $2, 'Inactive offer', false)", [
        product.rows[0].id,
        offerSlug,
      ]);
    } finally {
      client.release();
    }

    const response = await GET(makeRequest(offerSlug), { params: Promise.resolve({ offerSlug }) });
    expect(response.headers.get("location")).toContain("/productos");
  });
});
