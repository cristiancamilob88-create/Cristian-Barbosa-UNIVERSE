import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OfferRow } from "@/server/db/repositories/offer";

const original = {
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearEnv() {
  delete process.env.MERCADOPAGO_ACCESS_TOKEN;
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
}

function makeOffer(overrides: Partial<OfferRow> = {}): OfferRow {
  return {
    id: "offer-1",
    productId: "product-1",
    campaignId: null,
    slug: "test-offer",
    name: "Test Offer",
    priceCents: 5000000,
    currency: "COP",
    landingPath: "/productos",
    active: true,
    checkoutProvider: "mercadopago",
    checkoutUrl: null,
    purchaseType: "one_time",
    ctaLabel: null,
    metadata: {},
    ...overrides,
  };
}

describe("createOneTimePreference", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearEnv();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    restoreEnv();
    vi.unstubAllGlobals();
  });

  it("returns null and never calls the API when no access token is configured", async () => {
    vi.resetModules();
    const { createOneTimePreference } = await import("./mercadopago");

    const result = await createOneTimePreference({
      offer: makeOffer(),
      externalReference: "offer-1:visitor-1",
      siteUrl: "https://cristianbarbosa.com",
    });

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null and never calls the API for an offer with no real price", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
    vi.resetModules();
    const { createOneTimePreference } = await import("./mercadopago");

    const result = await createOneTimePreference({
      offer: makeOffer({ priceCents: null }),
      externalReference: "offer-1:visitor-1",
      siteUrl: "https://cristianbarbosa.com",
    });

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls checkout/preferences with the offer's real price and returns init_point on success", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pref-1", init_point: "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=pref-1" }),
    });
    vi.resetModules();
    const { createOneTimePreference } = await import("./mercadopago");

    const result = await createOneTimePreference({
      offer: makeOffer(),
      externalReference: "offer-1:visitor-1",
      siteUrl: "https://cristianbarbosa.com",
    });

    expect(result).toEqual({ initPoint: "https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=pref-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadopago.com/checkout/preferences",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.items).toEqual([{ title: "Test Offer", quantity: 1, unit_price: 50000, currency_id: "COP" }]);
    expect(body.external_reference).toBe("offer-1:visitor-1");
    expect(body.notification_url).toBe("https://cristianbarbosa.com/api/webhooks/mercadopago");
    expect(body.auto_return).toBe("approved");
  });

  it("omits auto_return when the site URL isn't a publicly-reachable https address (e.g. localhost)", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ init_point: "https://example.com/x" }) });
    vi.resetModules();
    const { createOneTimePreference } = await import("./mercadopago");

    await createOneTimePreference({
      offer: makeOffer(),
      externalReference: "offer-1:visitor-1",
      siteUrl: "http://localhost:3000",
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.auto_return).toBeUndefined();
  });

  it("returns null when Mercado Pago responds with a non-ok status", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => "bad request" });
    vi.resetModules();
    const { createOneTimePreference } = await import("./mercadopago");

    const result = await createOneTimePreference({
      offer: makeOffer(),
      externalReference: "offer-1:visitor-1",
      siteUrl: "https://cristianbarbosa.com",
    });

    expect(result).toBeNull();
  });

  it("returns null instead of throwing when fetch itself rejects", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
    fetchMock.mockRejectedValue(new Error("network down"));
    vi.resetModules();
    const { createOneTimePreference } = await import("./mercadopago");

    const result = await createOneTimePreference({
      offer: makeOffer(),
      externalReference: "offer-1:visitor-1",
      siteUrl: "https://cristianbarbosa.com",
    });

    expect(result).toBeNull();
  });
});

describe("getPayment", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearEnv();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    restoreEnv();
    vi.unstubAllGlobals();
  });

  it("returns null without an access token", async () => {
    vi.resetModules();
    const { getPayment } = await import("./mercadopago");

    expect(await getPayment("123")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a real Mercado Pago payment response to MercadoPagoPayment", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 123456789,
        status: "approved",
        transaction_amount: 50000,
        currency_id: "COP",
        external_reference: "offer-1:visitor-1",
        payer: { email: "buyer@example.com", first_name: "Ana", last_name: "Gómez", phone: { number: "3001234567" } },
      }),
    });
    vi.resetModules();
    const { getPayment } = await import("./mercadopago");

    const result = await getPayment("123456789");

    expect(result).toEqual({
      id: "123456789",
      status: "approved",
      transactionAmountCents: 5000000,
      currency: "COP",
      externalReference: "offer-1:visitor-1",
      payerEmail: "buyer@example.com",
      payerFirstName: "Ana",
      payerLastName: "Gómez",
      payerPhone: "3001234567",
    });
  });

  it("returns null on a non-ok response", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
    fetchMock.mockResolvedValue({ ok: false, status: 404, text: async () => "not found" });
    vi.resetModules();
    const { getPayment } = await import("./mercadopago");

    expect(await getPayment("does-not-exist")).toBeNull();
  });
});

describe("verifyWebhookSignature", () => {
  beforeEach(() => {
    clearEnv();
  });
  afterEach(restoreEnv);

  function sign(secret: string, dataId: string, requestId: string, ts: string): string {
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    return crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  }

  it("rejects when no webhook secret is configured", async () => {
    vi.resetModules();
    const { verifyWebhookSignature } = await import("./mercadopago");

    expect(
      verifyWebhookSignature({ xSignature: "ts=1,v1=abc", xRequestId: "req-1", dataId: "123" }),
    ).toBe(false);
  });

  it("rejects a missing signature or request-id header", async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = "a".repeat(20);
    vi.resetModules();
    const { verifyWebhookSignature } = await import("./mercadopago");

    expect(verifyWebhookSignature({ xSignature: null, xRequestId: "req-1", dataId: "123" })).toBe(false);
    expect(verifyWebhookSignature({ xSignature: "ts=1,v1=abc", xRequestId: null, dataId: "123" })).toBe(false);
  });

  it("accepts a correctly computed signature", async () => {
    const secret = "a".repeat(20);
    process.env.MERCADOPAGO_WEBHOOK_SECRET = secret;
    vi.resetModules();
    const { verifyWebhookSignature } = await import("./mercadopago");

    const v1 = sign(secret, "123456789", "req-1", "1700000000");
    const result = verifyWebhookSignature({
      xSignature: `ts=1700000000,v1=${v1}`,
      xRequestId: "req-1",
      dataId: "123456789",
    });

    expect(result).toBe(true);
  });

  it("rejects a tampered signature", async () => {
    const secret = "a".repeat(20);
    process.env.MERCADOPAGO_WEBHOOK_SECRET = secret;
    vi.resetModules();
    const { verifyWebhookSignature } = await import("./mercadopago");

    const v1 = sign(secret, "123456789", "req-1", "1700000000");
    const result = verifyWebhookSignature({
      // Different dataId than what was actually signed.
      xSignature: `ts=1700000000,v1=${v1}`,
      xRequestId: "req-1",
      dataId: "999999999",
    });

    expect(result).toBe(false);
  });
});

describe("buildCheckoutReference / parseCheckoutReference", () => {
  it("round-trips an offer id and visitor id", async () => {
    const { buildCheckoutReference, parseCheckoutReference } = await import("./mercadopago");

    const reference = buildCheckoutReference("offer-123", "visitor-abc");
    expect(parseCheckoutReference(reference)).toEqual({ offerId: "offer-123", visitorId: "visitor-abc" });
  });

  it("returns null for an empty or malformed reference", async () => {
    const { parseCheckoutReference } = await import("./mercadopago");

    expect(parseCheckoutReference(null)).toBeNull();
    expect(parseCheckoutReference("")).toBeNull();
    expect(parseCheckoutReference("no-colon-here")).toBeNull();
  });
});
