import { describe, it, expect } from "vitest";
import { formatInteger, formatCents, formatRatio, formatDuration } from "./format";

describe("formatInteger", () => {
  it("groups thousands", () => {
    expect(formatInteger(12345)).toBe("12.345");
  });

  it("renders zero as 0", () => {
    expect(formatInteger(0)).toBe("0");
  });
});

describe("formatCents", () => {
  it("converts cents to whole-unit COP currency", () => {
    // 150,000,000 cents == 1,500,000 COP.
    const formatted = formatCents(150_000_000);
    expect(formatted).toContain("1.500.000");
  });

  it("renders zero revenue explicitly, never blank", () => {
    expect(formatCents(0)).toMatch(/0/);
  });
});

describe("formatRatio", () => {
  it("renders null as an em dash — never a fabricated 0%", () => {
    expect(formatRatio(null)).toBe("—");
  });

  it("renders undefined the same way as null", () => {
    expect(formatRatio(undefined)).toBe("—");
  });

  it("renders a real ratio as a percentage", () => {
    expect(formatRatio(0.256)).toContain("25,6");
  });

  it("renders zero as an actual 0%, distinct from null", () => {
    expect(formatRatio(0)).not.toBe("—");
  });
});

describe("formatDuration", () => {
  it("renders null as an em dash — never a fabricated 0:00", () => {
    expect(formatDuration(null)).toBe("—");
  });

  it("renders undefined the same way as null", () => {
    expect(formatDuration(undefined)).toBe("—");
  });

  it("renders zero as an actual 0:00, distinct from null", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("formats seconds under a minute", () => {
    expect(formatDuration(45)).toBe("0:45");
  });

  it("formats minutes and pads seconds", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("rounds fractional seconds", () => {
    expect(formatDuration(59.6)).toBe("1:00");
  });
});
