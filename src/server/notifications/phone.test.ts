import { describe, it, expect } from "vitest";
import { normalizePhoneToE164 } from "./phone";

describe("normalizePhoneToE164", () => {
  it("trusts a number that already has a +, stripping formatting", () => {
    expect(normalizePhoneToE164("+57 300 123 4567")).toBe("+573001234567");
    expect(normalizePhoneToE164("+1 (415) 523-8886")).toBe("+14155238886");
  });

  it("adds +57 to a bare 10-digit Colombian mobile", () => {
    expect(normalizePhoneToE164("3001234567")).toBe("+573001234567");
  });

  it("adds + to a number already carrying the 57 country code", () => {
    expect(normalizePhoneToE164("573001234567")).toBe("+573001234567");
  });

  it("handles formatting characters around a bare Colombian mobile", () => {
    expect(normalizePhoneToE164("300 123 4567")).toBe("+573001234567");
    expect(normalizePhoneToE164("(300) 123-4567")).toBe("+573001234567");
  });

  it("returns null for a number too short to be real", () => {
    expect(normalizePhoneToE164("+123")).toBeNull();
  });

  it("returns null for an ambiguous number it shouldn't guess at", () => {
    // Not 10 digits, not starting with 3, no +, no 57 prefix — genuinely
    // ambiguous, never guessed.
    expect(normalizePhoneToE164("12345")).toBeNull();
  });
});
