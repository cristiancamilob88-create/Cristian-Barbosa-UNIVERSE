import { describe, it, expect } from "vitest";
import { bogotaDayRange, describeStep, mapTowns, originLabel, summarizeActivity, type ActivityStep } from "./adminActivity";

const step = (overrides: Partial<ActivityStep>): ActivityStep => ({
  at: "2026-10-07T06:00:00Z",
  eventName: "page_view",
  route: "/",
  cta: null,
  slug: null,
  offerSlug: null,
  ...overrides,
});

describe("bogotaDayRange", () => {
  // 3:06 a. m. in Bogotá on Oct 7 = 08:06 UTC.
  const now = new Date("2026-10-07T08:06:00Z");

  it("today starts at midnight Colombia time and ends now", () => {
    expect(bogotaDayRange(0, now)).toEqual({ from: "2026-10-07T05:00:00.000Z", to: "2026-10-07T08:06:00.000Z" });
  });

  it("yesterday is the full Colombian day", () => {
    expect(bogotaDayRange(1, now)).toEqual({ from: "2026-10-06T05:00:00.000Z", to: "2026-10-07T05:00:00.000Z" });
  });

  it("before 5 a.m. UTC it is still the previous day in Colombia", () => {
    expect(bogotaDayRange(0, new Date("2026-10-07T03:00:00Z")).from).toBe("2026-10-06T05:00:00.000Z");
  });
});

describe("describeStep", () => {
  it("names buttons, pages and links in plain Spanish", () => {
    expect(describeStep(step({ eventName: "cta_click", cta: "intent_music_early_access", route: "/musica" })).text).toBe(
      'Tocó el botón "Quiero escucharla antes que nadie (El Diamante)" en Música',
    );
    expect(describeStep(step({ eventName: "whatsapp_click", slug: "whatsapp-commercial", route: "/go/whatsapp-commercial" })).text).toBe(
      "Tocó WhatsApp comercial (negocios)",
    );
    expect(describeStep(step({ route: "/blog/el-diamante-cancion" })).text).toContain("El Diamante");
    expect(describeStep(step({ route: "/bienvenida/tamesis-2026" })).text).toBe("Abrió Bienvenida del QR (tamesis-2026)");
  });

  it("falls back to the raw id for an unknown button instead of guessing", () => {
    expect(describeStep(step({ eventName: "cta_click", cta: "intent_brand_new" })).text).toContain("intent_brand_new");
  });
});

describe("originLabel / summarizeActivity", () => {
  it("explains untagged traffic and groups by source", () => {
    expect(originLabel({ source: null, campaign: null, qr: null })).toBe("Sin origen (link sin etiqueta)");
    expect(originLabel({ source: "instagram", campaign: "lanzamiento-web", qr: null })).toBe("Instagram · lanzamiento-web");

    const summary = summarizeActivity([
      { label: "Visitante 1", firstAt: "", lastAt: "", source: "instagram", campaign: null, qr: null, medium: null, isContact: false, steps: [step({ eventName: "landing_view" }), step({ eventName: "cta_click" })] },
      { label: "Visitante 2", firstAt: "", lastAt: "", source: null, campaign: null, qr: null, medium: null, isContact: false, steps: [step({ eventName: "whatsapp_click" })] },
    ]);
    expect(summary).toMatchObject({ people: 2, pages: 1, buttons: 1, whatsapp: 1 });
    expect(summary.bySource).toEqual([["Instagram", 1], ["Sin origen", 1]]);
  });
});

describe("visitor conclusions", () => {
  it("reads what a visitor cared about and the actions worth a call", async () => {
    const { visitorInterest, visitDurationLabel } = await import("./adminActivity");
    const visitor = {
      label: "Visitante 1",
      firstAt: "2026-10-07T06:21:00Z",
      lastAt: "2026-10-07T06:24:00Z",
      source: "instagram",
      campaign: "lanzamiento-web",
      qr: null,
      medium: "historia",
      isContact: false,
      steps: [
        step({ eventName: "landing_view", route: "/" }),
        step({ eventName: "cta_click", cta: "intent_music", route: "/" }),
        step({ route: "/musica" }),
        step({ route: "/blog/el-diamante-cancion" }),
        step({ route: "/entrenar" }),
        step({ eventName: "whatsapp_click", slug: "whatsapp-commercial", route: "/go/whatsapp-commercial" }),
      ],
    };
    expect(visitorInterest(visitor)).toEqual({ area: "Música", signals: ["Quiso escribirte por WhatsApp (negocios)"] });
    expect(visitDurationLabel(visitor)).toBe("Estuvo unos 3 min");
    expect(visitDurationLabel({ ...visitor, steps: [visitor.steps[0]] })).toBe("Vio una sola página y se fue");
    expect(originLabel(visitor)).toBe("Instagram, desde una historia · lanzamiento-web");
  });
});

describe("map interactions", () => {
  const map = (overrides: Partial<ActivityStep>) => step({ eventName: "map_interaction", route: "/agenda", ...overrides });

  it("reads pins, list taps and searches in plain Spanish", () => {
    expect(describeStep(map({ mapAction: "pin", town: "Sopetrán" })).text).toBe("Tocó el pin de Sopetrán en el mapa");
    expect(describeStep(map({ mapAction: "list", town: "Támesis" })).text).toBe("Tocó Támesis en la lista del mapa");
    expect(describeStep(map({ mapAction: "search", town: "Támesis", query: "tamesis", found: true })).text).toBe(
      'Buscó "tamesis" en el mapa: sí está (Támesis)',
    );
    expect(describeStep(map({ mapAction: "town_check", town: "Jericó", query: "Jericó", found: false })).text).toBe(
      'Escribió "Jericó" en ¿Ya estuvo en tu pueblo?: no está en la gira',
    );
  });

  it("splits towns looked at from towns searched that aren't on the tour", () => {
    const result = mapTowns([
      map({ mapAction: "pin", town: "Sopetrán" }),
      map({ mapAction: "search", town: "Sopetrán", query: "sopetran", found: true }),
      map({ mapAction: "search", town: "Jericó", query: "Jericó", found: false }),
      step({ route: "/agenda" }),
    ]);
    expect(result.townsSeen).toEqual([["Sopetrán", 2]]);
    expect(result.townsMissing).toEqual([["Jericó", 1]]);
  });
});
