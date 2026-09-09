import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTestPool, resetActivityTables, closeTestPool, simulateVisit } from "@/server/db/testHelpers.integration";
import { POST } from "./route";

const WEBHOOK_SECRET = "test-webhook-secret-1234567890";

function sign(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");
}

function makeRequest(options: {
  dataId: string;
  requestId?: string;
  signed?: boolean;
  type?: string;
}): NextRequest {
  const requestId = options.requestId ?? "req-1";
  const ts = "1700000000";
  const type = options.type ?? "payment";
  const headers: Record<string, string> = {};
  if (options.signed !== false) {
    headers["x-signature"] = `ts=${ts},v1=${sign(options.dataId, requestId, ts)}`;
    headers["x-request-id"] = requestId;
  }
  return new NextRequest(
    `https://cristianbarbosa.test/api/webhooks/mercadopago?data.id=${options.dataId}&type=${type}`,
    { method: "POST", headers, body: JSON.stringify({ type, data: { id: options.dataId } }) },
  );
}

async function makeOffer(client: import("pg").PoolClient, priceCents = 5000000): Promise<string> {
  const product = await client.query(
    "insert into product (slug, name, kind) values ($1, 'MP webhook product', 'physical') returning id",
    [`mp-webhook-product-${Date.now()}-${Math.random()}`],
  );
  const offer = await client.query(
    `insert into offer (product_id, slug, name, active, checkout_provider, purchase_type, price_cents, currency)
     values ($1, $2, 'MP webhook offer', true, 'mercadopago', 'one_time', $3, 'COP')
     returning id`,
    [product.rows[0].id, `mp-webhook-offer-${Date.now()}-${Math.random()}`, priceCents],
  );
  return offer.rows[0].id;
}

function mockApprovedPayment(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({
      id: 987654321,
      status: "approved",
      transaction_amount: 50000,
      currency_id: "COP",
      external_reference: overrides.external_reference ?? null,
      payer: { email: "buyer@example.com", first_name: "Ana", last_name: "Gómez", phone: { number: "3001234567" } },
      ...overrides,
    }),
  };
}

describe("POST /api/webhooks/mercadopago", () => {
  const originalSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const originalToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  beforeEach(async () => {
    await resetActivityTables();
    process.env.MERCADOPAGO_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalSecret === undefined) delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    else process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    if (originalToken === undefined) delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    else process.env.MERCADOPAGO_ACCESS_TOKEN = originalToken;
  });

  afterAll(closeTestPool);

  it("rejects with 401 when the signature is missing or invalid", async () => {
    const response = await POST(makeRequest({ dataId: "1", signed: false }));
    expect(response.status).toBe(401);
  });

  it("rejects a tampered signature (dataId doesn't match what was signed)", async () => {
    const badSignature = sign("999", "req-1", "1700000000");
    const request = new NextRequest(
      "https://cristianbarbosa.test/api/webhooks/mercadopago?data.id=1&type=payment",
      {
        method: "POST",
        headers: { "x-signature": `ts=1700000000,v1=${badSignature}`, "x-request-id": "req-1" },
        body: JSON.stringify({ type: "payment", data: { id: "1" } }),
      },
    );
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("acks 200 without writing anything for a non-payment webhook type", async () => {
    const response = await POST(makeRequest({ dataId: "1", type: "merchant_order" }));
    expect(response.status).toBe(200);
    const rows = await getTestPool().query("select count(*) from orders");
    expect(Number(rows.rows[0].count)).toBe(0);
  });

  it("acks 200 without writing an order when the payment isn't approved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, status: "pending", transaction_amount: 100, currency_id: "COP", external_reference: null }),
      }),
    );

    const response = await POST(makeRequest({ dataId: "1" }));
    expect(response.status).toBe(200);
    const rows = await getTestPool().query("select count(*) from orders");
    expect(Number(rows.rows[0].count)).toBe(0);
  });

  it("creates a real paid order, order item, contact, and purchase interaction on a valid approved payment", async () => {
    const client = await getTestPool().connect();
    let offerId: string;
    let visitorId: string;
    try {
      offerId = await makeOffer(client);
      const visit = await simulateVisit(client, { utmSource: "instagram" });
      visitorId = visit.visitorId;
    } finally {
      client.release();
    }

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockApprovedPayment({ external_reference: `${offerId}:${visitorId}` })),
    );

    const response = await POST(makeRequest({ dataId: "987654321" }));
    expect(response.status).toBe(200);

    const orders = await getTestPool().query(
      "select external_provider, external_order_id, status, total_cents from orders",
    );
    expect(orders.rowCount).toBe(1);
    expect(orders.rows[0]).toMatchObject({
      external_provider: "mercadopago",
      external_order_id: "987654321",
      status: "paid",
      total_cents: 5000000,
    });

    const items = await getTestPool().query("select offer_id, quantity, unit_price_cents from order_items");
    expect(items.rowCount).toBe(1);
    expect(items.rows[0]).toMatchObject({ offer_id: offerId, quantity: 1, unit_price_cents: 5000000 });

    const contacts = await getTestPool().query("select email, name from contact where email = $1", ["buyer@example.com"]);
    expect(contacts.rowCount).toBe(1);
    expect(contacts.rows[0].name).toBe("Ana Gómez");

    const interactions = await getTestPool().query(
      "select event_name, entity_type, entity_id from interaction where event_name = 'purchase'",
    );
    expect(interactions.rowCount).toBe(1);
    expect(interactions.rows[0]).toMatchObject({ entity_type: "offer", entity_id: offerId });
  });

  it("is idempotent: a retried webhook for the same payment never creates a second order", async () => {
    const client = await getTestPool().connect();
    let offerId: string;
    let visitorId: string;
    try {
      offerId = await makeOffer(client);
      const visit = await simulateVisit(client, { utmSource: "instagram" });
      visitorId = visit.visitorId;
    } finally {
      client.release();
    }

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockApprovedPayment({ external_reference: `${offerId}:${visitorId}` })),
    );

    await POST(makeRequest({ dataId: "987654321" }));
    await POST(makeRequest({ dataId: "987654321" }));

    const orders = await getTestPool().query("select count(*) from orders");
    expect(Number(orders.rows[0].count)).toBe(1);
  });

  it("acks 200 without crashing when external_reference points at an offer or visitor that no longer exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockApprovedPayment({ external_reference: "00000000-0000-0000-0000-000000000000:00000000-0000-0000-0000-000000000000" }),
      ),
    );

    const response = await POST(makeRequest({ dataId: "987654321" }));
    expect(response.status).toBe(200);
    const orders = await getTestPool().query("select count(*) from orders");
    expect(Number(orders.rows[0].count)).toBe(0);
  });
});
