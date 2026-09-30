import { describe, expect, it } from "vitest";
import { createSessionToken } from "./session";
import { createMemberSessionToken, isMemberProtectedPath, readMemberSessionToken } from "./memberSession";

const SECRET = "m".repeat(32);
const CONTACT = "0b7f7a44-1c1e-4d8c-9d3e-3f1a2b3c4d5e";

describe("member session token", () => {
  it("round-trips the contact id", () => {
    expect(readMemberSessionToken(createMemberSessionToken(CONTACT, SECRET), SECRET)).toBe(CONTACT);
  });

  it("lasts 60 days, not the admin's 12 hours", () => {
    const issued = Date.now();
    const token = createMemberSessionToken(CONTACT, SECRET, issued);
    expect(readMemberSessionToken(token, SECRET, issued + 59 * 86_400_000)).toBe(CONTACT);
    expect(readMemberSessionToken(token, SECRET, issued + 61 * 86_400_000)).toBeNull();
  });

  it("rejects a token signed with another secret, or tampered with", () => {
    const token = createMemberSessionToken(CONTACT, SECRET);
    expect(readMemberSessionToken(token, "n".repeat(32))).toBeNull();
    const [payload, sig] = token.split(".");
    const tampered = Buffer.from(JSON.stringify({ sub: "member", cid: "someone-else", iat: 0, exp: Date.now() + 1e9 })).toString("base64url");
    expect(readMemberSessionToken(`${tampered}.${sig}`, SECRET)).toBeNull();
    expect(readMemberSessionToken(`${payload}.`, SECRET)).toBeNull();
    expect(readMemberSessionToken(null, SECRET)).toBeNull();
  });

  it("never accepts an admin token as a student session, even with the same secret", () => {
    expect(readMemberSessionToken(createSessionToken(SECRET), SECRET)).toBeNull();
  });
});

describe("isMemberProtectedPath", () => {
  it("gates the student pages", () => {
    expect(isMemberProtectedPath("/mi-plan")).toBe(true);
    expect(isMemberProtectedPath("/mi-plan/plan")).toBe(true);
  });

  it("leaves the sign-in page, static files and other routes alone", () => {
    expect(isMemberProtectedPath("/mi-plan/entrar")).toBe(false);
    expect(isMemberProtectedPath("/mi-plan/manifest.webmanifest")).toBe(false);
    expect(isMemberProtectedPath("/mi-plan/icon-192.png")).toBe(false);
    expect(isMemberProtectedPath("/mi-planes")).toBe(false);
    expect(isMemberProtectedPath("/entrenar/plan-diciembre")).toBe(false);
  });
});
