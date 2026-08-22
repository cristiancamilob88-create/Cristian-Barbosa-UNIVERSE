import { describe, expect, it } from "vitest";
import { classifyOutboundEvent } from "./socialPlatform";

describe("classifyOutboundEvent", () => {
  it("classifies whatsapp as its own event", () => {
    expect(classifyOutboundEvent("whatsapp")).toBe("whatsapp_click");
  });

  it.each(["instagram", "facebook", "tiktok", "youtube", "linkedin"])(
    "classifies %s as a social network click",
    (platform) => {
      expect(classifyOutboundEvent(platform)).toBe("social_click");
    },
  );

  it.each(["spotify", "other", "a-future-partner-link"])(
    "classifies a non-social, non-whatsapp platform (%s) as a generic outbound click",
    (platform) => {
      expect(classifyOutboundEvent(platform)).toBe("outbound_click");
    },
  );
});
