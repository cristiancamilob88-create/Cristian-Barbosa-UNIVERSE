import { describe, it, expect } from "vitest";
import { groupActivity, type ActivityRow } from "./activity";

function row(visitor: string, at: string, overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    visitor_id: visitor,
    contact_id: null,
    event_name: "page_view",
    route: "/",
    metadata: {},
    source_slug: null,
    campaign_slug: null,
    qr_slug: null,
    created_at: at,
    ...overrides,
  };
}

describe("groupActivity", () => {
  it("labels visitors by arrival order, lists most recent first, never exposes the raw visitor id", () => {
    const visitors = groupActivity([
      row("uuid-a", "2026-10-07T02:45:00Z"),
      row("uuid-b", "2026-10-07T02:48:00Z"),
      row("uuid-a", "2026-10-07T03:10:00Z"),
      row("uuid-b", "2026-10-07T02:50:00Z"),
    ]);

    expect(visitors.map((v) => v.label)).toEqual(["Visitante 1", "Visitante 2"]);
    expect(visitors[0].steps).toHaveLength(2);
    expect(visitors[0].lastAt).toBe("2026-10-07T03:10:00.000Z");
    expect(JSON.stringify(visitors)).not.toContain("uuid-");
  });

  it("keeps the first attribution seen and pulls cta/slug/offer out of metadata", () => {
    const [visitor] = groupActivity([
      row("v", "2026-10-07T06:21:00Z", { event_name: "landing_view", source_slug: "instagram", campaign_slug: "lanzamiento-web" }),
      row("v", "2026-10-07T06:22:00Z", { event_name: "cta_click", metadata: { cta: "intent_music" } }),
      row("v", "2026-10-07T06:24:00Z", {
        event_name: "whatsapp_click",
        route: "/go/whatsapp-commercial",
        metadata: { slug: "whatsapp-commercial" },
        source_slug: "whatsapp",
        contact_id: "c1",
      }),
    ]);

    expect(visitor.source).toBe("instagram");
    expect(visitor.campaign).toBe("lanzamiento-web");
    expect(visitor.isContact).toBe(true);
    expect(visitor.steps[1].cta).toBe("intent_music");
    expect(visitor.steps[2].slug).toBe("whatsapp-commercial");
  });
});
