import { describe, it, expect } from "vitest";
import { circusCountLabel, circusMunicipalityCount, groupBySubregion, tourStops } from "./tourStops";
import { pastShows } from "./pastShows";

describe("tourStops", () => {
  it("never overstates the circus count", () => {
    expect(circusMunicipalityCount).toBe(22);
    expect(circusCountLabel()).toBe("más de 20");
  });

  it("has no duplicate towns and every linked show exists", () => {
    const towns = tourStops.map((s) => s.town);
    expect(new Set(towns).size).toBe(towns.length);
    for (const stop of tourStops) {
      if (stop.showSlug) expect(pastShows.some((show) => show.slug === stop.showSlug)).toBe(true);
    }
  });

  it("keeps coordinates inside Colombia", () => {
    for (const stop of tourStops) {
      expect(stop.geo.lat).toBeGreaterThan(-4.3);
      expect(stop.geo.lat).toBeLessThan(13.5);
      expect(stop.geo.lng).toBeGreaterThan(-79.1);
      expect(stop.geo.lng).toBeLessThan(-66.8);
    }
  });

  it("groups by subregion in first-seen order", () => {
    const groups = groupBySubregion(tourStops.filter((s) => s.kind === "circo"));
    expect(groups.map((g) => g.subregion)).toEqual(["Chocó", "Suroeste", "Nordeste", "Norte", "Occidente"]);
  });
});
