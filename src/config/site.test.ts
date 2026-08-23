import { describe, it, expect } from "vitest";
import { navItems, secondaryNavItems } from "./site";

/**
 * Block 04.2 (docs/UNIVERSE_UX.md, "Arquitectura de intenciones"): every
 * route's `intent` phrase is the actual CTA text rendered on the
 * homepage hub and used as a bridge elsewhere — a missing or duplicate
 * one is a content bug that would silently ship (nothing in TypeScript
 * catches "two routes share a cta_click id").
 */
describe("site.ts nav items", () => {
  const allItems = [...navItems, ...secondaryNavItems];

  it("every item has a non-empty intent phrase and intentId", () => {
    for (const item of allItems) {
      expect(item.intent.trim().length).toBeGreaterThan(0);
      expect(item.intentId.trim().length).toBeGreaterThan(0);
    }
  });

  it("every intentId is unique — no two routes silently share one cta_click id", () => {
    const ids = allItems.map((item) => item.intentId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("intentId values follow the intent_* convention (docs/ANALYTICS_ENGINE.md)", () => {
    for (const item of allItems) {
      expect(item.intentId).toMatch(/^intent_[a-z_]+$/);
    }
  });

  it("never uses the rejected 'quiero ser parte' phrasing (docs/UNIVERSE_UX.md)", () => {
    for (const item of allItems) {
      expect(item.intent.toLowerCase()).not.toContain("ser parte");
    }
  });
});
