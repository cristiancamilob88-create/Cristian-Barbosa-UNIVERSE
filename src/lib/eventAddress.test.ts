import { describe, it, expect } from "vitest";
import { eventAddressSchema, toEventAddress } from "./eventAddress";

const envigado = [
  { longText: "Carrera 43A", shortText: "Cra. 43A", types: ["route"] },
  { longText: "1-50", shortText: "1-50", types: ["street_number"] },
  { longText: "Envigado", shortText: "Envigado", types: ["locality", "political"] },
  { longText: "Antioquia", shortText: "ANT", types: ["administrative_area_level_1", "political"] },
  { longText: "055422", shortText: "055422", types: ["postal_code"] },
  { longText: "Colombia", shortText: "CO", types: ["country", "political"] },
];

describe("toEventAddress", () => {
  it("maps a Places result into street, city, region, postal code, country and coordinates", () => {
    expect(
      toEventAddress({ components: envigado, latitude: 6.17, longitude: -75.58, placeId: "abc" }),
    ).toEqual({
      line: "Carrera 43A #1-50",
      city: "Envigado",
      region: "Antioquia",
      postalCode: "055422",
      country: "Colombia",
      latitude: 6.17,
      longitude: -75.58,
      placeId: "abc",
    });
  });

  it("falls back to the formatted address when there's no route/number (common in Colombia)", () => {
    const result = toEventAddress({
      components: envigado.filter((c) => !c.types.includes("route") && !c.types.includes("street_number")),
      formattedAddress: "Coliseo Cubierto, Támesis, Antioquia, Colombia",
    });
    expect(result.line).toBe("Coliseo Cubierto");
  });

  it("uses administrative_area_level_2 when there's no locality", () => {
    const result = toEventAddress({
      components: [{ longText: "Támesis", shortText: "Támesis", types: ["administrative_area_level_2"] }],
      formattedAddress: "Vereda X, Támesis",
    });
    expect(result.city).toBe("Támesis");
  });
});

describe("eventAddressSchema", () => {
  it("accepts a plain-text fallback address", () => {
    expect(eventAddressSchema.safeParse({ line: "Coliseo de Támesis" }).success).toBe(true);
  });

  it("rejects impossible coordinates", () => {
    expect(eventAddressSchema.safeParse({ line: "X calle 1", latitude: 120 }).success).toBe(false);
  });
});
