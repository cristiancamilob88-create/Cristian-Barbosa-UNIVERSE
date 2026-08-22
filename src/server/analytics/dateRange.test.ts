import { describe, expect, it } from "vitest";
import { resolveDateRange, parseDateRangeParams } from "./dateRange";

const NOW = new Date("2026-06-15T12:00:00.000Z");

describe("resolveDateRange", () => {
  it("today means since midnight UTC, not the last 24 hours", () => {
    const { from, to } = resolveDateRange("today", NOW);
    expect(from.toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(to).toBe(NOW);
  });

  it("7d is a trailing 7-day window ending now", () => {
    const { from, to } = resolveDateRange("7d", NOW);
    expect(from.toISOString()).toBe("2026-06-08T12:00:00.000Z");
    expect(to).toBe(NOW);
  });

  it("30d and 90d are trailing windows of the expected length", () => {
    expect(resolveDateRange("30d", NOW).from.toISOString()).toBe("2026-05-16T12:00:00.000Z");
    expect(resolveDateRange("90d", NOW).from.toISOString()).toBe("2026-03-17T12:00:00.000Z");
  });

  it("accepts a custom { from, to } range", () => {
    const { from, to } = resolveDateRange({ from: "2026-01-01", to: "2026-01-31" }, NOW);
    expect(from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(to.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("defaults a custom range's `to` to now when omitted", () => {
    const { to } = resolveDateRange({ from: "2026-01-01" }, NOW);
    expect(to).toBe(NOW);
  });

  it("rejects an invalid from/to date", () => {
    expect(() => resolveDateRange({ from: "not-a-date" }, NOW)).toThrow(/Invalid "from"/);
    expect(() => resolveDateRange({ from: "2026-01-01", to: "not-a-date" }, NOW)).toThrow(/Invalid "to"/);
  });

  it("rejects from after to", () => {
    expect(() => resolveDateRange({ from: "2026-02-01", to: "2026-01-01" }, NOW)).toThrow(
      /must not be after/,
    );
  });
});

describe("parseDateRangeParams", () => {
  it("defaults to 30d with no params", () => {
    const range = parseDateRangeParams(new URLSearchParams(""));
    expect(range.to.getTime() - range.from.getTime()).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
  });

  it("accepts a known preset", () => {
    const range = parseDateRangeParams(new URLSearchParams("range=7d"));
    expect(range.to.getTime() - range.from.getTime()).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
  });

  it("rejects an unknown preset", () => {
    expect(() => parseDateRangeParams(new URLSearchParams("range=5y"))).toThrow(/Unknown range/);
  });

  it("prefers an explicit from/to over range", () => {
    const range = parseDateRangeParams(new URLSearchParams("range=7d&from=2026-01-01&to=2026-01-02"));
    expect(range.from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-01-02T00:00:00.000Z");
  });
});
