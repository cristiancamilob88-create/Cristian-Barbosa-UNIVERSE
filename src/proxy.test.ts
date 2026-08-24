import { NextRequest } from "next/server";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { proxy } from "./proxy";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";

const SECRET = "f".repeat(32);

function makeRequest(path: string, sessionToken?: string): NextRequest {
  return new NextRequest(`https://cristianbarbosa.test${path}`, {
    headers: sessionToken ? { cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}` } : {},
  });
}

describe("proxy — admin route protection", () => {
  const original = {
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  afterAll(() => {
    // See src/server/auth/loginFlow.test.ts's afterAll for why plain
    // assignment is unsafe when the original value was undefined.
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = SECRET;
  });

  it("redirects an unauthenticated visitor to /admin/login", () => {
    const response = proxy(makeRequest("/admin"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("redirects an unauthenticated visitor away from a nested /admin/* page too", () => {
    const response = proxy(makeRequest("/admin/fuentes"));
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("lets a valid session through to /admin (no redirect)", () => {
    const token = createSessionToken(SECRET);
    const response = proxy(makeRequest("/admin", token));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an expired session back to /admin/login", () => {
    const staleToken = createSessionToken(SECRET, Date.now() - 24 * 60 * 60 * 1000);
    const response = proxy(makeRequest("/admin", staleToken));
    expect(response.headers.get("location")).toContain("/admin/login");
  });

  it("lets an unauthenticated visitor reach /admin/login itself (no redirect loop)", () => {
    const response = proxy(makeRequest("/admin/login"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an already-logged-in admin away from /admin/login back to /admin", () => {
    const token = createSessionToken(SECRET);
    const response = proxy(makeRequest("/admin/login", token));
    expect(response.headers.get("location")).toContain("/admin");
    expect(response.headers.get("location")).not.toContain("/admin/login");
  });

  it("never touches /admin auth logic for an unrelated public route", () => {
    const response = proxy(makeRequest("/entrenar"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("still assigns a visitor cookie on a public route (Block 01/02 behavior unchanged)", () => {
    const response = proxy(makeRequest("/entrenar"));
    expect(response.cookies.get("cb_visitor")).toBeDefined();
  });

  it("protects /admin correctly even when DATABASE_URL isn't set (Vercel readiness — src/server/env.ts)", () => {
    const originalDbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const response = proxy(makeRequest("/admin"));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/admin/login");
    } finally {
      if (originalDbUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDbUrl;
    }
  });
});
