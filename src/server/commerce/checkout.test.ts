import { describe, it, expect } from "vitest";
import { resolveCheckoutDestination } from "./checkout";
import type { OfferRow } from "@/server/db/repositories/offer";

const baseOffer: OfferRow = {
  id: "11111111-1111-4111-8111-111111111111",
  productId: "22222222-2222-4222-8222-222222222222",
  campaignId: null,
  slug: "digital-course-standard",
  name: "Curso digital",
  priceCents: 150_000,
  currency: "COP",
  landingPath: "/productos",
  active: true,
  checkoutProvider: "unavailable",
  checkoutUrl: null,
  purchaseType: "one_time",
  ctaLabel: null,
  metadata: {},
};

describe("resolveCheckoutDestination", () => {
  it("routes an inactive offer to the quote fallback, never a broken checkout", () => {
    const result = resolveCheckoutDestination({ ...baseOffer, active: false });
    expect(result.kind).toBe("unavailable");
    expect(result.url).toContain("/contacto");
    expect(result.url).toContain(`offer=${baseOffer.slug}`);
  });

  it("routes purchase_type='quote' to the quote fallback regardless of provider", () => {
    const result = resolveCheckoutDestination({
      ...baseOffer,
      purchaseType: "quote",
      checkoutProvider: "stripe",
      checkoutUrl: "https://checkout.stripe.com/whatever",
    });
    expect(result.kind).toBe("quote");
    expect(result.url).toContain("/contacto");
  });

  it("routes checkout_provider='unavailable' (the default) to the quote fallback", () => {
    const result = resolveCheckoutDestination(baseOffer);
    expect(result.kind).toBe("quote");
    expect(result.url).toContain("/contacto");
  });

  it("routes checkout_provider='internal' to the quote fallback — no first-party checkout exists yet", () => {
    const result = resolveCheckoutDestination({ ...baseOffer, checkoutProvider: "internal" });
    expect(result.kind).toBe("quote");
  });

  it("routes to the real checkout_url when a real provider and URL are both set", () => {
    const result = resolveCheckoutDestination({
      ...baseOffer,
      checkoutProvider: "hotmart",
      checkoutUrl: "https://pay.hotmart.com/ABC123",
    });
    expect(result.kind).toBe("external");
    expect(result.url).toBe("https://pay.hotmart.com/ABC123");
  });

  it("falls back safely when a real provider is set but checkout_url is missing (misconfiguration)", () => {
    const result = resolveCheckoutDestination({ ...baseOffer, checkoutProvider: "stripe", checkoutUrl: null });
    expect(result.kind).toBe("unavailable");
    expect(result.url).toContain("/contacto");
  });

  it("uses the given contactTopic in the fallback URL", () => {
    const result = resolveCheckoutDestination(baseOffer, "coaching");
    expect(result.url).toContain("topic=coaching");
  });

  it("defaults to topic=productos when no contactTopic is given", () => {
    const result = resolveCheckoutDestination(baseOffer);
    expect(result.url).toContain("topic=productos");
  });
});
