import crypto from "node:crypto";
import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken, isValidAdminSessionToken, ADMIN_SESSION_COOKIE } from "./session";

const SECRET = "a".repeat(32);
const OTHER_SECRET = "b".repeat(32);

describe("createSessionToken / verifySessionToken", () => {
  it("a freshly issued token verifies against the same secret", () => {
    const token = createSessionToken(SECRET);
    expect(verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejects a token once past its expiry", () => {
    const issuedAt = Date.now();
    const token = createSessionToken(SECRET, issuedAt);
    const wayLater = issuedAt + 13 * 60 * 60 * 1000; // > 12h TTL
    expect(verifySessionToken(token, SECRET, wayLater)).toBe(false);
  });

  it("still verifies just before expiry", () => {
    const issuedAt = Date.now();
    const token = createSessionToken(SECRET, issuedAt);
    const justBefore = issuedAt + 11 * 60 * 60 * 1000; // < 12h TTL
    expect(verifySessionToken(token, SECRET, justBefore)).toBe(true);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken(SECRET);
    expect(verifySessionToken(token, OTHER_SECRET)).toBe(false);
  });

  it("rejects a tampered payload (signature no longer matches)", () => {
    const token = createSessionToken(SECRET);
    const [, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: "admin", iat: 0, exp: 99999999999999 })).toString(
      "base64url",
    );
    expect(verifySessionToken(`${tamperedPayload}.${signature}`, SECRET)).toBe(false);
  });

  it.each([
    ["empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["no separator", "not-a-real-token"],
    ["empty payload", ".signature"],
    ["empty signature", "payload."],
  ])("rejects a malformed token (%s)", (_label, value) => {
    expect(verifySessionToken(value, SECRET)).toBe(false);
  });

  it("rejects a payload that isn't valid JSON once decoded", () => {
    const garbage = Buffer.from("not json").toString("base64url");
    // Sign it correctly so only the JSON.parse failure is under test.
    const signature = crypto.createHmac("sha256", SECRET).update(garbage).digest("base64url");
    expect(verifySessionToken(`${garbage}.${signature}`, SECRET)).toBe(false);
  });
});

describe("isValidAdminSessionToken", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = "postgres://test-only";
  });

  it("fails closed when ADMIN_SESSION_SECRET isn't configured", () => {
    delete process.env.ADMIN_SESSION_SECRET;
    const token = createSessionToken(SECRET);
    expect(isValidAdminSessionToken(token)).toBe(false);
  });

  it("accepts a token signed with the configured secret", () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    const token = createSessionToken(SECRET);
    expect(isValidAdminSessionToken(token)).toBe(true);
  });

  it("rejects a token signed with a stale/different secret", () => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
    const token = createSessionToken(OTHER_SECRET);
    expect(isValidAdminSessionToken(token)).toBe(false);
  });

  it("the cookie name is the one the whole app agrees on", () => {
    expect(ADMIN_SESSION_COOKIE).toBe("cb_admin_session");
  });
});
