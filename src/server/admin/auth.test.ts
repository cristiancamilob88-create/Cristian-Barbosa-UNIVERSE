import { NextRequest } from "next/server";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { requireAdminApiSession } from "./auth";
import { createSessionToken, ADMIN_SESSION_COOKIE } from "@/server/auth/session";

const SESSION_SECRET = "d".repeat(32);

function makeRequest({ sessionToken, bearer }: { sessionToken?: string; bearer?: string } = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (sessionToken) headers.cookie = `${ADMIN_SESSION_COOKIE}=${sessionToken}`;
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  return new NextRequest("https://cristianbarbosa.test/api/admin/contacts", { headers });
}

describe("requireAdminApiSession", () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = originalSecret;
  });

  beforeEach(() => {
    delete process.env.ADMIN_SESSION_SECRET;
  });

  it("fails closed (503) when ADMIN_SESSION_SECRET isn't configured — never open by default", () => {
    const denied = requireAdminApiSession(makeRequest());
    expect(denied?.status).toBe(503);
  });

  it("rejects (401) a request with no session cookie once configured", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    const denied = requireAdminApiSession(makeRequest());
    expect(denied?.status).toBe(401);
  });

  it("accepts a valid admin session cookie", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    const token = createSessionToken(SESSION_SECRET);
    const denied = requireAdminApiSession(makeRequest({ sessionToken: token }));
    expect(denied).toBeNull();
  });

  it("rejects a session cookie signed with a different secret", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    const foreignToken = createSessionToken("e".repeat(32));
    const denied = requireAdminApiSession(makeRequest({ sessionToken: foreignToken }));
    expect(denied?.status).toBe(401);
  });

  it("rejects an expired session cookie", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    const staleToken = createSessionToken(SESSION_SECRET, Date.now() - 24 * 60 * 60 * 1000);
    const denied = requireAdminApiSession(makeRequest({ sessionToken: staleToken }));
    expect(denied?.status).toBe(401);
  });

  it("never accepts a bearer token — PII has no shared-token fallback, unlike requireAnalyticsAuth", () => {
    process.env.ADMIN_SESSION_SECRET = SESSION_SECRET;
    const denied = requireAdminApiSession(makeRequest({ bearer: "anything" }));
    expect(denied?.status).toBe(401);
  });
});
