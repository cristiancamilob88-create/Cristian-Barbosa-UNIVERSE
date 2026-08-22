import { describe, expect, it } from "vitest";
import {
  classifyChannel,
  deserializeSource,
  hasAttributionSignal,
  parseSource,
  serializeSource,
} from "./attribution";

describe("hasAttributionSignal", () => {
  it("is false with no utm params", () => {
    expect(hasAttributionSignal(new URLSearchParams(""))).toBe(false);
  });

  it("is true when any utm_* param is present", () => {
    expect(hasAttributionSignal(new URLSearchParams("utm_source=show"))).toBe(true);
  });

  it("is true when only a qr param is present", () => {
    expect(hasAttributionSignal(new URLSearchParams("qr=aura-2026-main"))).toBe(true);
  });
});

describe("classifyChannel", () => {
  it("prefers an explicit utm_medium", () => {
    expect(classifyChannel(new URLSearchParams("utm_medium=qr"), null)).toBe("qr");
  });

  it("falls back to direct with no params and no referrer", () => {
    expect(classifyChannel(new URLSearchParams(""), null)).toBe("direct");
  });

  it("classifies known social referrers as organic_social", () => {
    expect(classifyChannel(new URLSearchParams(""), "https://www.instagram.com/p/123")).toBe(
      "organic_social",
    );
  });

  it("classifies known search referrers as organic_search", () => {
    expect(classifyChannel(new URLSearchParams(""), "https://www.google.com/search?q=x")).toBe(
      "organic_search",
    );
  });

  it("falls back to referral for unknown referrers", () => {
    expect(classifyChannel(new URLSearchParams(""), "https://someblog.example/post")).toBe(
      "referral",
    );
  });
});

describe("parseSource / serializeSource / deserializeSource", () => {
  it("round-trips a QR campaign URL end to end, including the qr slug", () => {
    const params = new URLSearchParams(
      "utm_source=aura&utm_medium=qr&utm_campaign=aura-envigado&qr=aura-2026-main",
    );
    const now = new Date("2026-01-01T00:00:00.000Z");
    const source = parseSource(params, null, "/entrenar", now);

    expect(source).toMatchObject({
      utmSource: "aura",
      utmMedium: "qr",
      utmCampaign: "aura-envigado",
      qrSlug: "aura-2026-main",
      channel: "qr",
      landingPath: "/entrenar",
      capturedAt: now.toISOString(),
    });

    const roundTripped = deserializeSource(serializeSource(source));
    expect(roundTripped).toEqual(source);
  });

  it("deserializes garbage as null instead of throwing", () => {
    expect(deserializeSource("not json")).toBeNull();
    expect(deserializeSource(undefined)).toBeNull();
  });
});
