import { describe, it, expect } from "vitest";
import { buildMapPlaces, googleMapsSearchUrl, matchesFilter, matchesSearch } from "./mapPlaces";
import { tourStops } from "@/config/tourStops";

const upcoming = {
  date: "2026-11-06",
  endDate: "2026-11-09",
  town: "Jardín",
  department: "Antioquia",
  title: "Circo Santiago de Chile",
  geo: { lat: 5.6, lng: -75.82 },
};

describe("buildMapPlaces", () => {
  it("puts upcoming dates first, then home, then every tour stop", () => {
    const places = buildMapPlaces([upcoming]);
    expect(places).toHaveLength(tourStops.length + 1);
    expect(places[0]).toMatchObject({ kind: "next", town: "Jardín" });
    expect(places[1]).toMatchObject({ kind: "home", town: "Envigado" });
    expect(places.find((p) => p.town === "Támesis")?.showPath).toBe("/shows/realizados/tamesis-2026");
  });

  it("links every place to Google Maps without an API key", () => {
    expect(googleMapsSearchUrl("Santa Fe de Antioquia", "Antioquia")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Santa%20Fe%20de%20Antioquia%2C%20Antioquia%2C%20Colombia",
    );
    expect(buildMapPlaces([]).every((p) => !p.googleMapsUrl.includes("key="))).toBe(true);
  });
});

describe("filters and search", () => {
  const places = buildMapPlaces([upcoming]);

  it("filters by kind; schools include home", () => {
    expect(places.filter((p) => matchesFilter(p, "circo")).every((p) => p.kind === "circo")).toBe(true);
    expect(places.filter((p) => matchesFilter(p, "edu")).map((p) => p.town)).toContain("Envigado");
    expect(places.filter((p) => matchesFilter(p, "next"))).toHaveLength(1);
  });

  it("searches without accents and through corregimientos", () => {
    expect(places.filter((p) => matchesSearch(p, "tamesis")).map((p) => p.town)).toEqual(["Támesis"]);
    expect(places.filter((p) => matchesSearch(p, "bolombolo")).map((p) => p.town)).toEqual(["Venecia"]);
    expect(places.filter((p) => matchesSearch(p, "  ")).length).toBe(places.length);
  });
});
