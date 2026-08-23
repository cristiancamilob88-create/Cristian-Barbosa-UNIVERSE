import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("produces the self-describing scrypt:salt:hash format", () => {
    const stored = hashPassword("correct horse battery staple");
    const parts = stored.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("scrypt");
    expect(parts[1]).toHaveLength(32); // 16 random bytes, hex-encoded
    expect(parts[2]).toHaveLength(128); // 64-byte key, hex-encoded
  });

  it("uses a fresh random salt each call — two hashes of the same password differ", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("verifies the correct password", () => {
    const stored = hashPassword("cristian-barbosa-2026");
    expect(verifyPassword("cristian-barbosa-2026", stored)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const stored = hashPassword("cristian-barbosa-2026");
    expect(verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("rejects an empty password against a real hash", () => {
    const stored = hashPassword("cristian-barbosa-2026");
    expect(verifyPassword("", stored)).toBe(false);
  });

  it.each([
    ["missing prefix", "aa:bb"],
    ["wrong algorithm tag", "bcrypt:aa:bb"],
    ["not hex", "scrypt:zz:zz"],
    ["empty string", ""],
    ["wrong hash length", "scrypt:aabbcc:aabbcc"],
  ])("rejects a malformed stored value (%s)", (_label, stored) => {
    expect(verifyPassword("anything", stored)).toBe(false);
  });
});
