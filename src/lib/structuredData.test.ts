import { describe, it, expect } from "vitest";
import { personJsonLd, toSameAs } from "./structuredData";
import type { SocialProfile } from "@/types/crm";

function profile(overrides: Partial<SocialProfile>): SocialProfile {
  return {
    id: "1",
    slug: "x",
    platform: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/someone",
    active: true,
    displayOrder: 1,
    category: "social",
    ...overrides,
  };
}

describe("toSameAs", () => {
  it("keeps real social profiles and strips tracking query strings", () => {
    expect(
      toSameAs([
        profile({ url: "https://www.instagram.com/someone/?igsi=abc&utm_source=qr" }),
        profile({ platform: "twitter", url: "https://x.com/someone" }),
      ]),
    ).toEqual(["https://www.instagram.com/someone", "https://x.com/someone"]);
  });

  it("drops WhatsApp, community and donation links — not identity profiles", () => {
    expect(
      toSameAs([
        profile({ category: "community", url: "https://chat.whatsapp.com/abc" }),
        profile({ category: "commercial", url: "https://wa.me/message/abc" }),
        profile({ category: "support", url: "https://www.paypal.com/donate/?id=1" }),
      ]),
    ).toEqual([]);
  });

  it("drops seed placeholders with no handle", () => {
    expect(
      toSameAs([profile({ url: "https://instagram.com/" }), profile({ url: "https://tiktok.com/@" })]),
    ).toEqual([]);
  });

  it("turns a mobile share host into the canonical www one", () => {
    expect(toSameAs([profile({ platform: "youtube", url: "https://m.youtube.com/channel/abc" })])).toEqual([
      "https://www.youtube.com/channel/abc",
    ]);
  });

  it("dedupes and skips unparseable URLs", () => {
    expect(
      toSameAs([
        profile({ url: "https://x.com/someone" }),
        profile({ url: "https://x.com/someone/" }),
        profile({ url: "not a url" }),
      ]),
    ).toEqual(["https://x.com/someone"]);
  });
});

describe("personJsonLd", () => {
  it("omits sameAs entirely when there are no profiles", () => {
    expect(personJsonLd()).not.toHaveProperty("sameAs");
    expect(personJsonLd(["https://x.com/someone"]).sameAs).toEqual(["https://x.com/someone"]);
  });
});
