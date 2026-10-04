import { describe, it, expect, vi } from "vitest";

describe("getUpcomingShows", () => {
  it("drops shows that already ended and sorts the rest by date", async () => {
    vi.resetModules();
    vi.doMock("./upcomingShows", async (importOriginal) => {
      const mod = await importOriginal<typeof import("./upcomingShows")>();
      mod.upcomingShows.push(
        { date: "2026-10-20", town: "B", department: "Antioquia", title: "x", geo: { lat: 6, lng: -75 } },
        { date: "2026-10-01", endDate: "2026-10-04", town: "A", department: "Antioquia", title: "x", geo: { lat: 6, lng: -75 } },
        { date: "2026-09-01", town: "Old", department: "Antioquia", title: "x", geo: { lat: 6, lng: -75 } },
      );
      return mod;
    });
    const { getUpcomingShows } = await import("./upcomingShows");
    expect(getUpcomingShows("2026-10-04").map((s) => s.town)).toEqual(["A", "B"]);
    expect(getUpcomingShows("2026-10-05").map((s) => s.town)).toEqual(["B"]);
    vi.doUnmock("./upcomingShows");
  });

  it("computes today in Colombia time", async () => {
    const { colombiaToday } = await import("./upcomingShows");
    // 03:00 UTC on Oct 5 is still Oct 4 in Bogotá (UTC-5).
    expect(colombiaToday(new Date("2026-10-05T03:00:00Z"))).toBe("2026-10-04");
  });
});
